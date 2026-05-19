// contact-form-structure.json 읽기/쓰기
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STRUCTURE_PATH = path.join(__dirname, "../lib/contact-form-structure.json");

export function readContactFormStructure() {
  return JSON.parse(fs.readFileSync(STRUCTURE_PATH, "utf8"));
}

/**
 * @param {{ fields: unknown[]; layout: unknown[] }} structure
 */
export function writeContactFormStructure(structure) {
  const body = `${JSON.stringify(structure, null, 2)}\n`;
  fs.writeFileSync(STRUCTURE_PATH, body, "utf8");
}

export function getContactFormStructurePath() {
  return STRUCTURE_PATH;
}
