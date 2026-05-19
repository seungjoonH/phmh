// locales/manifest.json 읽기·쓰기
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MANIFEST_PATH = path.join(__dirname, "../locales/manifest.json");

/**
 * @returns {{ order: string[], hidden: string[] }}
 */
export function readLocaleManifest() {
  const raw = fs.readFileSync(MANIFEST_PATH, "utf8");
  return JSON.parse(raw);
}

/**
 * @param {{ order: string[], hidden: string[] }} manifest
 */
export function writeLocaleManifest(manifest) {
  const body = `${JSON.stringify(manifest, null, 2)}\n`;
  fs.writeFileSync(MANIFEST_PATH, body, "utf8");
}

export function getManifestPath() {
  return MANIFEST_PATH;
}
