#!/usr/bin/env node
// data/therapists manifest·locale 디렉터리·blocks 스키마 검증
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { mergeTherapistRecord } from "./therapist-locale-merge.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data/therapists");

function fail(msg) {
  console.error(`[test:therapists] ${msg}`);
  process.exit(1);
}

const manifestPath = path.join(DATA_DIR, "manifest.json");
if (!fs.existsSync(manifestPath)) fail("manifest.json missing");

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
if (!Array.isArray(manifest.order)) fail("manifest.order must be array");
if (!Array.isArray(manifest.contentLocales) || manifest.contentLocales.length === 0) {
  fail("manifest.contentLocales must be a non-empty array");
}
const LOCALES = manifest.contentLocales;

const blockIds = new Set();

for (const slug of manifest.order) {
  const dir = path.join(DATA_DIR, slug);
  const metaPath = path.join(dir, "meta.js");
  if (!fs.existsSync(metaPath)) {
    fail(`missing ${slug}/meta.js (expected locale directory layout)`);
  }

  const metaMod = await import(`${pathToFileURL(metaPath).href}?t=${Date.now()}`);
  const meta = metaMod.default;
  if (!meta?.slug || meta.slug !== slug) {
    fail(`${slug}/meta.js: slug must match directory name`);
  }
  if (!meta.portrait) fail(`${slug}/meta.js: portrait missing`);

  const slices = {};
  for (const loc of LOCALES) {
    const locPath = path.join(dir, `${loc}.js`);
    if (!fs.existsSync(locPath)) fail(`missing ${slug}/${loc}.js`);
    const mod = await import(`${pathToFileURL(locPath).href}?t=${Date.now()}`);
    slices[loc] = mod.default;
    if (!slices[loc]?.list?.name) fail(`${slug}/${loc}.js: list.name missing`);
    if (!slices[loc]?.profile?.header?.name) {
      fail(`${slug}/${loc}.js: profile.header.name missing`);
    }
  }

  const record = mergeTherapistRecord(meta, slices, LOCALES);

  const blocks = record.profile?.blocks ?? [];
  for (const block of blocks) {
    if (!block.id) fail(`${slug}: block missing id`);
    if (blockIds.has(block.id)) fail(`duplicate block id: ${block.id}`);
    blockIds.add(block.id);

    if (block.type === "heading") {
      if (block.level < 1 || block.level > 6) {
        fail(`${slug}: heading level must be 1-6`);
      }
    }
  }

  const legacy = path.join(DATA_DIR, `${slug}.js`);
  if (fs.existsSync(legacy)) {
    fail(`legacy file still present: ${slug}.js (use ${slug}/en.js etc.)`);
  }
}

for (const slug of Object.keys(manifest.entries ?? {})) {
  if (!manifest.order.includes(slug)) {
    fail(`entries key not in order: ${slug}`);
  }
}

const registrySrc = fs.readFileSync(
  path.join(ROOT, "lib/therapists/registry.ts"),
  "utf8",
);
for (const slug of manifest.order) {
  if (!registrySrc.includes(`"${slug}"`)) {
    fail(`lib/therapists/registry.ts missing slug: ${slug}`);
  }
  if (!registrySrc.includes(`${slug}/meta.js`)) {
    fail(`lib/therapists/registry.ts missing import for ${slug}/meta.js`);
  }
}

console.log(`[test:therapists] OK (${manifest.order.length} therapists)`);
