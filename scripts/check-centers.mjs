#!/usr/bin/env node
// Center 데이터 파일과 SSOT 규칙 검사
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const manifestPath = path.join(ROOT, "data/centers/manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const slugs = manifest.order ?? [];
const locales = manifest.contentLocales ?? [];
let failed = false;

function fail(message) {
  console.error(message);
  failed = true;
}

if (new Set(slugs).size !== slugs.length) {
  fail("data/centers/manifest.json: duplicate slug in order");
}

for (const slug of slugs) {
  const dir = path.join(ROOT, "data/centers", slug);
  const metaPath = path.join(dir, "meta.js");
  if (!fs.existsSync(metaPath)) {
    fail(`Missing center meta: ${slug}`);
    continue;
  }
  const meta = (await import(`${pathToFileURL(metaPath).href}?t=${Date.now()}`)).default;
  if (meta.slug !== slug) fail(`${slug}: meta.slug mismatch`);
  if (!meta.contactRef) fail(`${slug}: contactRef required`);
  if (!meta.mapRef) fail(`${slug}: mapRef required`);
  if (!meta.defaultHero && meta.hero) {
    const heroAbs = path.join(ROOT, "public", meta.hero.replace(/^\//, ""));
    if (!fs.existsSync(heroAbs)) fail(`${slug}: hero file missing: ${meta.hero}`);
  }
  for (const image of meta.gallery ?? []) {
    const imageAbs = path.join(ROOT, "public", String(image.src).replace(/^\//, ""));
    if (!image.id) fail(`${slug}: gallery item id required`);
    if (!fs.existsSync(imageAbs)) fail(`${slug}: gallery file missing: ${image.src}`);
  }
  for (const loc of locales) {
    const locPath = path.join(dir, `${loc}.js`);
    if (!fs.existsSync(locPath)) {
      fail(`${slug}: missing locale ${loc}`);
      continue;
    }
    const slice = (await import(`${pathToFileURL(locPath).href}?t=${Date.now()}`)).default;
    if (typeof slice.nav?.label !== "string") fail(`${slug}/${loc}: nav.label required`);
    if (typeof slice.page?.title !== "string") fail(`${slug}/${loc}: page.title required`);
    if ("contact" in slice) fail(`${slug}/${loc}: contact values must stay in siteContact SSOT`);
  }
}

const defaultHeroPath = path.join(ROOT, "lib/default-hero.ts");
if (!fs.existsSync(defaultHeroPath)) fail("Missing lib/default-hero.ts");

if (failed) process.exit(1);
console.log(`OK: ${slugs.length} centers checked`);
