#!/usr/bin/env node
// en locale·content와 ko/jp/cn의 객체·배열 구조(키·길이·타입) 일치 검사
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

/** @param {unknown} a @param {unknown} b @param {string} p */
function diffStructure(a, b, p = "") {
  /** @type {string[]} */
  const errors = [];

  if (Array.isArray(a) !== Array.isArray(b)) {
    errors.push(`${p || "(root)"}: array vs non-array`);
    return errors;
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      errors.push(`${p || "(root)"}: array length ${a.length} vs ${b.length}`);
    }
    const n = Math.min(a.length, b.length);
    for (let i = 0; i < n; i++) {
      errors.push(...diffStructure(a[i], b[i], `${p}[${i}]`));
    }
    return errors;
  }

  const ta = typeof a;
  const tb = typeof b;
  if (ta !== tb) {
    errors.push(`${p || "(root)"}: type ${ta} vs ${tb}`);
    return errors;
  }

  if (a === null || b === null || ta !== "object") {
    return errors;
  }

  const aKeys = Object.keys(/** @type {Record<string, unknown>} */ (a)).sort();
  const bKeys = Object.keys(/** @type {Record<string, unknown>} */ (b)).sort();
  const onlyA = aKeys.filter((k) => !bKeys.includes(k));
  const onlyB = bKeys.filter((k) => !aKeys.includes(k));
  if (onlyA.length) {
    errors.push(`${p || "(root)"}: keys only in en: ${onlyA.join(", ")}`);
  }
  if (onlyB.length) {
    errors.push(`${p || "(root)"}: keys only in locale: ${onlyB.join(", ")}`);
  }

  for (const key of aKeys) {
    if (!bKeys.includes(key)) continue;
    const next = p ? `${p}.${key}` : key;
    errors.push(
      ...diffStructure(
        /** @type {Record<string, unknown>} */ (a)[key],
        /** @type {Record<string, unknown>} */ (b)[key],
        next,
      ),
    );
  }

  return errors;
}

/** @param {string} relPath */
async function importModule(relPath) {
  return import(pathToFileURL(path.join(ROOT, relPath)).href);
}

const manifest = JSON.parse(
  fs.readFileSync(path.join(ROOT, "locales/manifest.json"), "utf8"),
);

const en = (await importModule("locales/en.js")).default;

let failed = false;

for (const id of manifest.order) {
  if (id === "en") continue;
  const filePath = `locales/${id}.js`;
  if (!fs.existsSync(path.join(ROOT, filePath))) {
    console.error(`Missing locale file: ${id}`);
    failed = true;
    continue;
  }
  const mod = (await importModule(filePath)).default;
  const errors = diffStructure(en, mod);
  if (errors.length) {
    console.error(`Structure mismatch: locales/${id}.js (${errors.length} issues)`);
    for (const line of errors.slice(0, 25)) {
      console.error(`  ${line}`);
    }
    if (errors.length > 25) {
      console.error(`  … and ${errors.length - 25} more`);
    }
    failed = true;
  } else {
    console.log(`OK: locales/${id}.js structure matches en.js`);
  }
}

const contentPairs = [
  {
    label: "service-areas",
    enExport: "serviceAreasSectionsEn",
    locales: [
      ["ko", "serviceAreasSectionsKo"],
      ["jp", "serviceAreasSectionsJp"],
      ["cn", "serviceAreasSectionsCn"],
    ],
  },
  {
    label: "services",
    enExport: "servicesSectionsEn",
    locales: [
      ["ko", "servicesSectionsKo"],
      ["jp", "servicesSectionsJp"],
      ["cn", "servicesSectionsCn"],
    ],
  },
];

for (const { label, enExport, locales } of contentPairs) {
  const enMod = await importModule(`locales/content/${label}.en.js`);
  const enTree = enMod[enExport];
  for (const [id, exportName] of locales) {
    const locMod = await importModule(`locales/content/${label}.${id}.js`);
    const locTree = locMod[exportName];
    const errors = diffStructure(enTree, locTree);
    if (errors.length) {
      console.error(
        `Structure mismatch: locales/content/${label}.${id}.js (${errors.length} issues)`,
      );
      for (const line of errors.slice(0, 15)) {
        console.error(`  ${line}`);
      }
      if (errors.length > 15) {
        console.error(`  … and ${errors.length - 15} more`);
      }
      failed = true;
    } else {
      console.log(`OK: locales/content/${label}.${id}.js structure matches ${label}.en.js`);
    }
  }
}

if (failed) {
  process.exit(1);
}

console.log("All locale structures match en.");
