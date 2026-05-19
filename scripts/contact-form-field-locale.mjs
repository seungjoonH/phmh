// contact-form-locale/*.js 에 필드 문구 블록 추가·삭제
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { readLocaleManifest } from "./locale-manifest-io.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

function exportSuffix(id) {
  return id.charAt(0).toUpperCase() + id.slice(1);
}

/**
 * @param {string} filePath
 * @param {string} name
 * @param {unknown} obj
 */
function writeJsExport(filePath, name, obj) {
  const body = `// Contact 폼 locale 문구 (데이터만)\nexport const ${name} = ${JSON.stringify(obj, null, 2)};\n`;
  fs.writeFileSync(filePath, body, "utf8");
}

/**
 * @param {string} fieldId
 * @param {string} type
 */
export function defaultFieldCopy(fieldId, type) {
  const label = fieldId;
  switch (type) {
    case "textarea":
      return { label, placeholder: "" };
    case "date":
      return { label, placeholder: "" };
    case "select":
    case "checkboxGroup":
      return { label, options: ["Option 1"] };
    case "consent":
      return { label, body: "", checkbox: "" };
    default:
      return { label, placeholder: "" };
  }
}

/**
 * @param {string} fieldId
 * @param {string} type
 */
export async function addContactFieldToAllLocales(fieldId, type) {
  const copy = defaultFieldCopy(fieldId, type);
  for (const localeId of readLocaleManifest().order) {
    const filePath = path.join(ROOT, `lib/contact-form-locale/${localeId}.js`);
    if (!fs.existsSync(filePath)) continue;
    const exportName = `contactFormLocale${exportSuffix(localeId)}`;
    const mod = await import(pathToFileURL(filePath).href);
    const block = mod[exportName];
    if (!block?.fields) {
      throw new Error(`Invalid contact locale file: ${localeId}`);
    }
    block.fields[fieldId] = structuredClone(copy);
    writeJsExport(filePath, exportName, block);
  }
}

/**
 * @param {string} fieldId
 */
export async function removeContactFieldFromAllLocales(fieldId) {
  for (const localeId of readLocaleManifest().order) {
    const filePath = path.join(ROOT, `lib/contact-form-locale/${localeId}.js`);
    if (!fs.existsSync(filePath)) continue;
    const exportName = `contactFormLocale${exportSuffix(localeId)}`;
    const mod = await import(pathToFileURL(filePath).href);
    const block = mod[exportName];
    if (!block?.fields) continue;
    delete block.fields[fieldId];
    writeJsExport(filePath, exportName, block);
  }
}
