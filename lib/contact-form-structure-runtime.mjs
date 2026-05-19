// Contact 폼 구조 JSON 로드 + 편집 런타임 오버라이드 (Node·Next 공통)
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STRUCTURE_PATH = path.join(__dirname, "contact-form-structure.json");

/** @type {import("./contact-form-types.ts").ContactFormStructure | null} */
let runtimeStructure = null;

function readStaticStructure() {
  return JSON.parse(fs.readFileSync(STRUCTURE_PATH, "utf8"));
}

/**
 * @param {import("./contact-form-types.ts").ContactFormStructure} source
 */
function cloneStructure(source) {
  return {
    fields: structuredClone(source.fields),
    layout: structuredClone(source.layout),
  };
}

export function getContactFormStructure() {
  const source = runtimeStructure ?? readStaticStructure();
  return cloneStructure(source);
}

/**
 * @param {import("./contact-form-types.ts").ContactFormStructure} next
 */
export function setRuntimeContactFormStructure(next) {
  runtimeStructure = cloneStructure(next);
}

export function clearRuntimeContactFormStructure() {
  runtimeStructure = null;
}
