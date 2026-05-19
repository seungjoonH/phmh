#!/usr/bin/env node
// manifest locale 키가 en과 일치하는지 검사
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const manifest = JSON.parse(
  fs.readFileSync(path.join(ROOT, "locales/manifest.json"), "utf8"),
);

function flattenKeys(obj, prefix = "") {
  return Object.entries(obj).flatMap(([key, value]) => {
    const next = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      return flattenKeys(value, next);
    }
    return [next];
  });
}

const en = (await import(pathToFileURL(path.join(ROOT, "locales/en.js")).href)).default;
const enKeys = new Set(flattenKeys(en));

let failed = false;

for (const id of manifest.order) {
  const filePath = path.join(ROOT, `locales/${id}.js`);
  if (!fs.existsSync(filePath)) {
    console.error(`Missing locale file: ${id}`);
    failed = true;
    continue;
  }
  const mod = (await import(pathToFileURL(filePath).href)).default;
  const keys = new Set(flattenKeys(mod));
  const onlyEn = [...enKeys].filter((k) => !keys.has(k)).sort();
  const onlyLocale = [...keys].filter((k) => !enKeys.has(k)).sort();
  if (onlyEn.length || onlyLocale.length) {
    console.error(`Locale key mismatch for ${id}:`);
    if (onlyEn.length) console.error(`  only in en:`, onlyEn.slice(0, 20).join(", "));
    if (onlyLocale.length) console.error(`  only in ${id}:`, onlyLocale.slice(0, 20).join(", "));
    failed = true;
  } else {
    console.log(`OK: ${id} — ${keys.size} keys match en`);
  }
}

if (failed) process.exit(1);
