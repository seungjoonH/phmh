#!/usr/bin/env node
// en locale·content 구조를 ko/jp/cn에 반영 (문자열 값은 각 locale 정책 유지)
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

/** @param {unknown} value */
function blankLeaves(value) {
  if (typeof value === "string") return "";
  if (Array.isArray(value)) return value.map(blankLeaves);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, blankLeaves(v)]),
    );
  }
  return value;
}

/** @param {string} relPath */
async function loadDefault(relPath) {
  const mod = await import(pathToFileURL(path.join(ROOT, relPath)).href);
  return mod.default ?? mod[Object.keys(mod).find((k) => k !== "default")];
}

const enAreas = (
  await import(pathToFileURL(path.join(ROOT, "locales/content/service-areas.en.js")).href)
).serviceAreasSectionsEn;

const jpAreasPath = path.join(ROOT, "locales/content/service-areas.jp.js");
fs.writeFileSync(
  jpAreasPath,
  `// 서비스 분야 일본어 본문 (en.js와 동일 구조)\nexport const serviceAreasSectionsJp = ${JSON.stringify(structuredClone(enAreas), null, 2)};\n`,
  "utf8",
);

const cnAreasPath = path.join(ROOT, "locales/content/service-areas.cn.js");
fs.writeFileSync(
  cnAreasPath,
  `// 서비스 분야 중국어 본문 (en.js와 동일 구조, 빈 문자열)\nexport const serviceAreasSectionsCn = ${JSON.stringify(blankLeaves(enAreas), null, 2)};\n`,
  "utf8",
);

console.log("Wrote", jpAreasPath, cnAreasPath);
