#!/usr/bin/env node
// en 구조를 복제한 빈 locale 파일 생성
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { readLocaleManifest, writeLocaleManifest } from "./locale-manifest-io.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

/**
 * @param {unknown} value
 */
function emptyDeep(value) {
  if (typeof value === "string") return "";
  if (Array.isArray(value)) return value.map((item) => emptyDeep(item));
  if (value && typeof value === "object") {
    /** @type {Record<string, unknown>} */
    const out = {};
    for (const [key, child] of Object.entries(value)) {
      out[key] = emptyDeep(child);
    }
    return out;
  }
  return value;
}

/**
 * @param {string} id
 */
function exportSuffix(id) {
  return id.charAt(0).toUpperCase() + id.slice(1);
}

/**
 * @param {string} name
 * @param {unknown} obj
 */
function writeJsExport(filePath, name, obj) {
  const body = `export const ${name} = ${JSON.stringify(obj, null, 2)};\n`;
  fs.writeFileSync(filePath, body, "utf8");
}

/**
 * @param {string} localeId
 */
export async function createEmptyLocale(localeId) {
  if (!/^[a-z]{2}$/.test(localeId)) {
    throw new Error(`Invalid locale id: ${localeId}`);
  }

  const mainPath = path.join(ROOT, `locales/${localeId}.js`);
  if (fs.existsSync(mainPath)) {
    throw new Error(`Locale file already exists: ${localeId}`);
  }

  const flagPath = path.join(ROOT, `public/flags/${localeId}.svg`);
  if (!fs.existsSync(flagPath)) {
    throw new Error(`Flag asset missing: public/flags/${localeId}.svg`);
  }

  const en = (
    await import(pathToFileURL(path.join(ROOT, "locales/en.js")).href)
  ).default;
  const servicesEn = (
    await import(pathToFileURL(path.join(ROOT, "locales/content/services.en.js")).href)
  ).servicesSectionsEn;
  const areasEn = (
    await import(pathToFileURL(path.join(ROOT, "locales/content/service-areas.en.js")).href)
  ).serviceAreasSectionsEn;
  const contactEn = (
    await import(pathToFileURL(path.join(ROOT, "lib/contact-form-locale/en.js")).href)
  ).contactFormLocaleEn;

  const suffix = exportSuffix(localeId);
  const servicesName = `servicesSections${suffix}`;
  const areasName = `serviceAreasSections${suffix}`;
  const contactName = `contactFormLocale${suffix}`;

  writeJsExport(
    path.join(ROOT, `locales/content/services.${localeId}.js`),
    servicesName,
    emptyDeep(servicesEn),
  );
  writeJsExport(
    path.join(ROOT, `locales/content/service-areas.${localeId}.js`),
    areasName,
    emptyDeep(areasEn),
  );
  writeJsExport(
    path.join(ROOT, `lib/contact-form-locale/${localeId}.js`),
    contactName,
    emptyDeep(contactEn),
  );

  const payload = emptyDeep(en);
  payload.services = {
    ...emptyDeep(en.services),
    sections: "__SECTIONS_SERVICES__",
  };
  payload.serviceAreas = {
    ...emptyDeep(en.serviceAreas),
    sections: "__SECTIONS_AREAS__",
  };
  payload.contact = {
    ...emptyDeep(en.contact),
    form: "__CONTACT_FORM__",
    insuranceOptions: "__CONTACT_INSURANCE__",
    seekingHelpOptions: "__CONTACT_SEEKING__",
  };

  let body = JSON.stringify(payload, null, 2);
  body = body
    .replace('"__SECTIONS_SERVICES__"', servicesName)
    .replace('"__SECTIONS_AREAS__"', areasName)
    .replace('"__CONTACT_FORM__"', "contactFormMessages.form")
    .replace('"__CONTACT_INSURANCE__"', "contactFormMessages.insuranceOptions")
    .replace('"__CONTACT_SEEKING__"', "contactFormMessages.seekingHelpOptions");

  const mainSource = `// ${localeId} locale (빈 번역 — 편집 모드에서 채움)
import { buildContactFormMessages, registerContactFormLocale } from "../lib/contact-form-schema.ts";
import { ${contactName} } from "../lib/contact-form-locale/${localeId}.js";
import { ${areasName} } from "./content/service-areas.${localeId}.js";
import { ${servicesName} } from "./content/services.${localeId}.js";

registerContactFormLocale("${localeId}", ${contactName});
const contactFormMessages = buildContactFormMessages("${localeId}");

export default ${body};
`;
  fs.writeFileSync(mainPath, mainSource, "utf8");

  const manifest = readLocaleManifest();
  if (!manifest.order.includes(localeId)) {
    manifest.order.push(localeId);
    writeLocaleManifest(manifest);
  }

  return { localeId, files: [mainPath] };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const id = process.argv[2];
  if (!id) {
    console.error("Usage: node scripts/create-empty-locale.mjs <localeId>");
    process.exit(1);
  }
  createEmptyLocale(id)
    .then((result) => {
      console.log(`Created locale: ${result.localeId}`);
    })
    .catch((err) => {
      console.error(err instanceof Error ? err.message : err);
      process.exit(1);
    });
}
