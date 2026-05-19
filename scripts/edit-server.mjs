#!/usr/bin/env node
// 로컬 편집 API — locale 패치·파일 CRUD (localhost 전용)
import * as fs from "fs";
import * as http from "http";
import * as path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { spawn } from "child_process";
import {
  patchLocaleFile,
  replaceSectionFlow,
  replaceStringArray,
} from "./edit-locale-patch.mjs";
import { getTextLocaleFile, resolveTextTarget } from "./edit-text-resolve.mjs";
import { readLocaleManifest, writeLocaleManifest } from "./locale-manifest-io.mjs";
import { createEmptyLocale } from "./create-empty-locale.mjs";
import {
  readContactFormStructure,
  writeContactFormStructure,
} from "./contact-form-structure-io.mjs";
import {
  addContactFieldToAllLocales,
  removeContactFieldFromAllLocales,
} from "./contact-form-field-locale.mjs";
import { EDIT_SERVER_PORT } from "../lib/edit/ports.mjs";
import { runReleaseDeploy } from "./edit-release.mjs";
import { buildImageHistoryBackupPath } from "../lib/edit/image-write-path.mjs";

/** @type {Record<string, { file: string; publicPath: string; altKey?: string }>} */
let IMAGE_REGISTRY = {};

async function loadImageRegistry() {
  if (Object.keys(IMAGE_REGISTRY).length > 0) return IMAGE_REGISTRY;

  /** @param {string} publicPath */
  const fromPublic = (publicPath) => ({
    file: `public${publicPath}`,
    publicPath,
  });

  const { pageHeroes } = await import(
    pathToFileURL(path.join(ROOT, "lib/page-heroes.ts")).href
  );
  const { therapyImages, areaImages } = await import(
    pathToFileURL(path.join(ROOT, "lib/service-images.ts")).href
  );

  IMAGE_REGISTRY = {
    "site.logo": {
      file: "public/logo.png",
      publicPath: "/logo.png",
      altKey: "common.logoAlt",
    },
    "site.logoLight": {
      file: "public/logo-light.png",
      publicPath: "/logo-light.png",
      altKey: "common.logoAlt",
    },
    ...Object.fromEntries(
      Object.entries(pageHeroes).map(([k, v]) => [`heroes.${k}`, fromPublic(v)]),
    ),
    ...Object.fromEntries(
      Object.entries(therapyImages).map(([k, v]) => [`therapy.${k}`, fromPublic(v)]),
    ),
    ...Object.fromEntries(
      Object.entries(areaImages).map(([k, v]) => [`area.${k}`, fromPublic(v)]),
    ),
  };
  return IMAGE_REGISTRY;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const PORT = Number(process.env.PHMH_EDIT_SERVER_PORT ?? EDIT_SERVER_PORT);
const EDIT_HEADER = "x-phmh-edit-mode";

const DENY_PREFIXES = ["node_modules", ".git", ".next", "out"];
const DENY_FILES = [".env", ".env.local", ".env.production"];

function getLocaleIds() {
  return readLocaleManifest().order;
}

/**
 * @param {string} rel
 */
function resolveSafePath(rel) {
  const normalized = path.normalize(rel).replace(/^(\.\.(\/|\\|$))+/, "");
  const abs = path.join(ROOT, normalized);
  if (!abs.startsWith(ROOT)) {
    throw new Error("Path escapes project root");
  }
  const relPosix = path.relative(ROOT, abs).split(path.sep).join("/");
  for (const prefix of DENY_PREFIXES) {
    if (relPosix === prefix || relPosix.startsWith(`${prefix}/`)) {
      throw new Error(`Path denied: ${relPosix}`);
    }
  }
  const base = path.basename(abs);
  if (DENY_FILES.some((d) => base === d || base.startsWith(".env"))) {
    throw new Error(`File denied: ${base}`);
  }
  return abs;
}

/**
 * @param {string} file
 */
function localeModuleUrl(file) {
  return `${pathToFileURL(file).href}?phmh=${Date.now()}`;
}

/**
 * @param {string} file
 * @param {string} exportName
 */
async function importLocaleModule(file, exportName) {
  const mod = await import(localeModuleUrl(file));
  return exportName === "default"
    ? mod.default
    : /** @type {Record<string, unknown>} */ (mod)[exportName];
}

/**
 * @param {Record<string, unknown>} obj
 * @param {string} keyPath
 */
function getAtPath(obj, keyPath) {
  const parts = keyPath.split(".");
  let current = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== "object") return undefined;
    current = /** @type {Record<string, unknown>} */ (current)[part];
  }
  return typeof current === "string" ? current : undefined;
}

/**
 * @param {unknown} obj
 * @param {string} keyPath
 */
function getStringArrayAtPath(obj, keyPath) {
  const parts = keyPath.split(".");
  let current = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== "object") return undefined;
    current = /** @type {Record<string, unknown>} */ (current)[part];
  }
  if (!Array.isArray(current)) return undefined;
  if (!current.every((item) => typeof item === "string")) return undefined;
  return /** @type {string[]} */ (current);
}

/**
 * @param {string} file
 * @param {string} exportName
 * @param {string} innerPath
 */
async function readStringArrayFromLocaleFile(file, exportName, innerPath) {
  const root = await importLocaleModule(file, exportName);
  const value = getStringArrayAtPath(root, innerPath);
  if (!value) {
    throw new Error(`Key ${innerPath} is not a string array in ${file}`);
  }
  return value;
}

/**
 * @param {import("http").IncomingMessage} req
 */
function assertEditRequest(req) {
  const host = req.headers.host ?? "";
  if (!host.startsWith("127.0.0.1") && !host.startsWith("localhost")) {
    throw new Error("Only localhost allowed");
  }
  if (req.headers[EDIT_HEADER] !== "1") {
    throw new Error("Missing edit mode header");
  }
}

/**
 * @param {string} localeFile
 * @param {string} backupDir
 */
function backupFile(localeFile, backupDir) {
  fs.mkdirSync(backupDir, { recursive: true });
  const name = path.basename(localeFile);
  fs.copyFileSync(localeFile, path.join(backupDir, name));
}

/**
 * @param {string} file
 * @param {string} exportName
 * @param {string} innerPath
 */
async function readStringFromLocaleFile(file, exportName, innerPath) {
  const root = await importLocaleModule(file, exportName);
  const parts = innerPath.split(".");
  const last = parts[parts.length - 1];
  if (/^\d+$/.test(last)) {
    const parentPath = parts.slice(0, -1).join(".");
    const arr = getStringArrayAtPath(root, parentPath);
    if (arr) {
      const index = Number(last);
      const item = arr[index];
      if (typeof item === "string") return item;
      if (index >= arr.length) return "";
    }
  }
  const value = getAtPath(root, innerPath);
  if (typeof value !== "string") {
    throw new Error(`Key ${innerPath} is not a string in ${file}`);
  }
  return value;
}

/**
 * @param {string} keyPath
 */
async function readTextRegistry(keyPath) {
  const target = resolveTextTarget(keyPath);
  /** @type {Record<string, string>} */
  const locales = {};
  for (const id of getLocaleIds()) {
    const { file, exportName, patchPath } = getTextLocaleFile(ROOT, id, target);
    locales[id] = await readStringFromLocaleFile(file, exportName, patchPath);
  }
  return locales;
}

/**
 * @param {string} keyPath
 * @param {Record<string, string>} locales
 */
async function patchTextRegistry(keyPath, locales) {
  const target = resolveTextTarget(keyPath);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.join(ROOT, ".phmh-edit-backups", timestamp);
  /** @type {Record<string, string>} */
  const beforePatch = {};
  /** @type {string[]} */
  const touchedFiles = [];

  for (const id of getLocaleIds()) {
    const nextValue = locales[id];
    if (typeof nextValue !== "string") {
      throw new Error(`Missing locale value: ${id}`);
    }
    const { file, patchPath } = getTextLocaleFile(ROOT, id, target);
    if (!(file in beforePatch)) {
      beforePatch[file] = fs.readFileSync(file, "utf8");
      backupFile(file, backupDir);
      touchedFiles.push(file);
    }
    const current = fs.readFileSync(file, "utf8");
    const patched = patchLocaleFile(current, patchPath, nextValue);
    fs.writeFileSync(file, patched, "utf8");
  }

  const check = await runLocaleTest();
  if (!check.ok) {
    for (const file of touchedFiles) {
      fs.writeFileSync(file, beforePatch[file], "utf8");
    }
    throw new Error(check.error ?? "Locale key check failed");
  }

  return { backupDir, files: touchedFiles };
}

/**
 * @param {string} sectionKey e.g. services.sections.couples
 * @param {object[]} flow StoredFlowBlock[]
 */
async function patchSectionFlowRegistry(sectionKey, flow) {
  const target = resolveTextTarget(sectionKey);
  if (target.kind !== "content") {
    throw new Error(`Section flow patch requires content section: ${sectionKey}`);
  }
  const sectionId = target.innerPath.split(".")[0];
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.join(ROOT, ".phmh-edit-backups", timestamp);
  /** @type {Record<string, string>} */
  const beforePatch = {};
  /** @type {string[]} */
  const touchedFiles = [];

  for (const id of getLocaleIds()) {
    const { file } = getTextLocaleFile(ROOT, id, target);
    if (!(file in beforePatch)) {
      beforePatch[file] = fs.readFileSync(file, "utf8");
      backupFile(file, backupDir);
      touchedFiles.push(file);
    }
    const current = fs.readFileSync(file, "utf8");
    const patched = replaceSectionFlow(current, sectionId, flow);
    fs.writeFileSync(file, patched, "utf8");
  }

  const check = await runLocaleTest();
  if (!check.ok) {
    for (const file of touchedFiles) {
      fs.writeFileSync(file, beforePatch[file], "utf8");
    }
    throw new Error(check.error ?? "Locale key check failed");
  }

  return { backupDir, files: touchedFiles };
}

/**
 * @param {string} keyPath
 */
async function readArrayRegistry(keyPath) {
  const target = resolveTextTarget(keyPath);
  /** @type {Record<string, string[]>} */
  const locales = {};
  for (const id of getLocaleIds()) {
    const { file, exportName, patchPath } = getTextLocaleFile(ROOT, id, target);
    locales[id] = await readStringArrayFromLocaleFile(file, exportName, patchPath);
  }
  return locales;
}

/**
 * @param {string} keyPath
 * @param {Record<string, string[]>} locales
 */
async function patchArrayRegistry(keyPath, locales) {
  const target = resolveTextTarget(keyPath);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.join(ROOT, ".phmh-edit-backups", timestamp);
  /** @type {Record<string, string>} */
  const beforePatch = {};
  /** @type {string[]} */
  const touchedFiles = [];

  for (const id of getLocaleIds()) {
    const nextItems = locales[id];
    if (!Array.isArray(nextItems)) {
      throw new Error(`Missing locale array: ${id}`);
    }
    const { file, patchPath } = getTextLocaleFile(ROOT, id, target);
    if (!(file in beforePatch)) {
      beforePatch[file] = fs.readFileSync(file, "utf8");
      backupFile(file, backupDir);
      touchedFiles.push(file);
    }
    const current = fs.readFileSync(file, "utf8");
    const patched = replaceStringArray(current, patchPath, nextItems);
    fs.writeFileSync(file, patched, "utf8");
  }

  const check = await runLocaleTest();
  if (!check.ok) {
    for (const file of touchedFiles) {
      fs.writeFileSync(file, beforePatch[file], "utf8");
    }
    throw new Error(check.error ?? "Locale key check failed");
  }

  return { backupDir, files: touchedFiles };
}

function runLocaleTest() {
  return new Promise((resolve) => {
    const child = spawn("pnpm", ["run", "test:locale"], {
      cwd: ROOT,
      stdio: ["ignore", "pipe", "pipe"],
      shell: true,
    });
    let err = "";
    child.stderr?.on("data", (d) => {
      err += d.toString();
    });
    child.on("close", (code) => {
      if (code === 0) resolve({ ok: true });
      else resolve({ ok: false, error: err || `exit ${code}` });
    });
  });
}

/**
 * @param {import("http").IncomingMessage} req
 */
async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

/**
 * @param {import("http").ServerResponse} res
 * @param {number} status
 * @param {unknown} data
 */
function sendJson(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": `Content-Type, ${EDIT_HEADER}`,
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "OPTIONS") {
      sendJson(res, 204, {});
      return;
    }

    assertEditRequest(req);
    const url = new URL(req.url ?? "/", `http://${req.headers.host}`);

    if (req.method === "GET" && url.pathname === "/health") {
      sendJson(res, 200, { ok: true });
      return;
    }

    const registryMatch = url.pathname.match(/^\/registry\/text\/(.+)$/);
    if (req.method === "GET" && registryMatch) {
      const key = decodeURIComponent(registryMatch[1]);
      const locales = await readTextRegistry(key);
      sendJson(res, 200, { key, locales });
      return;
    }

    const imageRegistryMatch = url.pathname.match(/^\/registry\/image\/(.+)$/);
    if (req.method === "GET" && imageRegistryMatch) {
      const key = decodeURIComponent(imageRegistryMatch[1]);
      const registry = await loadImageRegistry();
      const entry = registry[key];
      if (!entry) {
        sendJson(res, 404, { error: `Unknown image key: ${key}` });
        return;
      }
      sendJson(res, 200, { key, ...entry });
      return;
    }

    const arrayRegistryMatch = url.pathname.match(/^\/registry\/array\/(.+)$/);
    if (req.method === "GET" && arrayRegistryMatch) {
      const key = decodeURIComponent(arrayRegistryMatch[1]);
      const locales = await readArrayRegistry(key);
      sendJson(res, 200, { key, locales });
      return;
    }

    if (req.method === "POST" && url.pathname === "/patch/text") {
      const body = await readJsonBody(req);
      const { key, locales } = body;
      if (!key || !locales) {
        sendJson(res, 400, { error: "key and locales required" });
        return;
      }
      const result = await patchTextRegistry(key, locales);
      sendJson(res, 200, { ok: true, ...result });
      return;
    }

    if (req.method === "POST" && url.pathname === "/patch/array") {
      const body = await readJsonBody(req);
      const { key, locales } = body;
      if (!key || !locales) {
        sendJson(res, 400, { error: "key and locales required" });
        return;
      }
      const result = await patchArrayRegistry(key, locales);
      sendJson(res, 200, { ok: true, ...result });
      return;
    }

    if (req.method === "POST" && url.pathname === "/patch/section-flow") {
      const body = await readJsonBody(req);
      const { sectionKey, flow } = body;
      if (!sectionKey || !Array.isArray(flow)) {
        sendJson(res, 400, { error: "sectionKey and flow array required" });
        return;
      }
      const result = await patchSectionFlowRegistry(sectionKey, flow);
      sendJson(res, 200, { ok: true, ...result });
      return;
    }

    if (req.method === "GET" && url.pathname === "/registry/locales/manifest") {
      sendJson(res, 200, readLocaleManifest());
      return;
    }

    const localeCatalogMatch = url.pathname.match(
      /^\/registry\/locales\/([a-z]{2})\/catalog$/,
    );
    if (req.method === "GET" && localeCatalogMatch) {
      const localeId = localeCatalogMatch[1];
      const mainPath = path.join(ROOT, `locales/${localeId}.js`);
      if (!fs.existsSync(mainPath)) {
        sendJson(res, 404, { error: `Locale not found: ${localeId}` });
        return;
      }
      const suffix = localeId.charAt(0).toUpperCase() + localeId.slice(1);
      const contactName = `contactFormLocale${suffix}`;
      const mod = await import(localeModuleUrl(mainPath));
      const contactMod = await import(
        localeModuleUrl(path.join(ROOT, `lib/contact-form-locale/${localeId}.js`)),
      );
      sendJson(res, 200, {
        messages: mod.default,
        contact: contactMod[contactName],
      });
      return;
    }

    if (req.method === "POST" && url.pathname === "/patch/locales/manifest") {
      const body = await readJsonBody(req);
      const { order, hidden } = body;
      if (!Array.isArray(order) || !Array.isArray(hidden)) {
        sendJson(res, 400, { error: "order and hidden arrays required" });
        return;
      }
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupDir = path.join(ROOT, ".phmh-edit-backups", timestamp);
      const manifestPath = path.join(ROOT, "locales/manifest.json");
      const before = fs.readFileSync(manifestPath, "utf8");
      backupFile(manifestPath, backupDir);
      writeLocaleManifest({ order, hidden });
      const check = await runLocaleTest();
      if (!check.ok) {
        fs.writeFileSync(manifestPath, before, "utf8");
        throw new Error(check.error ?? "Locale key check failed");
      }
      sendJson(res, 200, { ok: true, backupDir });
      return;
    }

    if (req.method === "GET" && url.pathname === "/registry/contact-form/structure") {
      sendJson(res, 200, readContactFormStructure());
      return;
    }

    if (req.method === "POST" && url.pathname === "/patch/contact-form/structure") {
      const body = await readJsonBody(req);
      const { fields, layout } = body;
      if (!Array.isArray(fields) || !Array.isArray(layout)) {
        sendJson(res, 400, { error: "fields and layout arrays required" });
        return;
      }
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupDir = path.join(ROOT, ".phmh-edit-backups", timestamp);
      const structurePath = path.join(ROOT, "lib/contact-form-structure.json");
      backupFile(structurePath, backupDir);
      writeContactFormStructure({ fields, layout });
      sendJson(res, 200, { ok: true, backupDir });
      return;
    }

    if (req.method === "POST" && url.pathname === "/contact-form/fields/add") {
      const body = await readJsonBody(req);
      const { field, layout } = body;
      if (!field?.id || !field?.type) {
        sendJson(res, 400, { error: "field.id and field.type required" });
        return;
      }
      const structure = readContactFormStructure();
      if (structure.fields.some((f) => f.id === field.id)) {
        sendJson(res, 400, { error: `Field already exists: ${field.id}` });
        return;
      }
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupDir = path.join(ROOT, ".phmh-edit-backups", timestamp);
      const structurePath = path.join(ROOT, "lib/contact-form-structure.json");
      backupFile(structurePath, backupDir);
      structure.fields.push(field);
      structure.layout = layout ?? [
        ...structure.layout,
        { type: "field", fieldId: field.id },
      ];
      writeContactFormStructure(structure);
      await addContactFieldToAllLocales(field.id, field.type);
      sendJson(res, 200, { ok: true, structure, backupDir });
      return;
    }

    if (req.method === "POST" && url.pathname === "/contact-form/fields/remove") {
      const body = await readJsonBody(req);
      const { fieldId, layout } = body;
      if (!fieldId) {
        sendJson(res, 400, { error: "fieldId required" });
        return;
      }
      const structure = readContactFormStructure();
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupDir = path.join(ROOT, ".phmh-edit-backups", timestamp);
      const structurePath = path.join(ROOT, "lib/contact-form-structure.json");
      backupFile(structurePath, backupDir);
      structure.fields = structure.fields.filter((f) => f.id !== fieldId);
      structure.layout = (layout ?? structure.layout)
        .map((item) => {
          if (item.type === "row") {
            const fields = item.fields.filter((id) => id !== fieldId);
            return fields.length > 0 ? { type: "row", fields } : null;
          }
          return item.fieldId === fieldId ? null : item;
        })
        .filter(Boolean);
      writeContactFormStructure(structure);
      await removeContactFieldFromAllLocales(fieldId);
      sendJson(res, 200, { ok: true, structure, backupDir });
      return;
    }

    if (req.method === "POST" && url.pathname === "/locales/create") {
      const body = await readJsonBody(req);
      const { id } = body;
      if (!id || typeof id !== "string") {
        sendJson(res, 400, { error: "id required" });
        return;
      }
      const result = await createEmptyLocale(id);
      sendJson(res, 200, { ok: true, ...result, manifest: readLocaleManifest() });
      return;
    }

    if (req.method === "POST" && url.pathname === "/fs/write") {
      const body = await readJsonBody(req);
      const { path: relPath, content, encoding = "utf8", writeKind } = body;
      if (!relPath) {
        sendJson(res, 400, { error: "path required" });
        return;
      }
      const relPosix = String(relPath).split("\\").join("/");
      const abs = resolveSafePath(relPosix);
      fs.mkdirSync(path.dirname(abs), { recursive: true });

      if (writeKind === "image" && encoding === "base64") {
        let archivedPath;
        if (fs.existsSync(abs)) {
          const archiveRel = buildImageHistoryBackupPath(relPosix);
          const archiveAbs = resolveSafePath(archiveRel);
          fs.mkdirSync(path.dirname(archiveAbs), { recursive: true });
          fs.renameSync(abs, archiveAbs);
          archivedPath = archiveRel;
        }
        fs.writeFileSync(abs, Buffer.from(content, "base64"));
        sendJson(res, 200, { ok: true, path: relPosix, archivedPath });
        return;
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupDir = path.join(ROOT, ".phmh-edit-backups", timestamp);
      if (fs.existsSync(abs)) {
        backupFile(abs, backupDir);
      }
      if (encoding === "base64") {
        fs.writeFileSync(abs, Buffer.from(content, "base64"));
      } else {
        fs.writeFileSync(abs, content, "utf8");
      }
      sendJson(res, 200, { ok: true, path: relPosix });
      return;
    }

    if (req.method === "GET" && url.pathname === "/git/status") {
      const summary = await new Promise((resolve, reject) => {
        const child = spawn("git", ["status", "--short"], { cwd: ROOT });
        let out = "";
        child.stdout.on("data", (d) => {
          out += d.toString();
        });
        child.on("close", (code) => {
          if (code === 0) resolve(out.trim() || "(변경 없음)");
          else reject(new Error("git status failed"));
        });
      });
      sendJson(res, 200, { summary });
      return;
    }

    if (req.method === "POST" && url.pathname === "/git/deploy") {
      const result = await runReleaseDeploy(ROOT);
      sendJson(res, 200, { ok: true, ...result });
      return;
    }

    sendJson(res, 404, { error: "Not found" });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.includes("denied") || message.includes("localhost") ? 403 : 500;
    sendJson(res, status, { error: message });
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`[edit-server] http://127.0.0.1:${PORT}`);
});
