// data/centers 파일 읽기·쓰기 (edit-server)
import * as fs from "fs";
import * as path from "path";
import { pathToFileURL } from "url";
import { buildImageHistoryBackupPath } from "../lib/edit/image-write-path.mjs";

/**
 * @param {string} displayName
 * @param {string[]} existingSlugs
 */
function slugFromDisplayName(displayName, existingSlugs = []) {
  const kept = displayName.replace(/[^a-zA-Z ]+/g, " ").replace(/\s+/g, " ").trim();
  let base = kept
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .join("-")
    .replace(/^-+|-+$/g, "");
  if (!base) base = `center-${Date.now().toString(36)}`;
  const used = new Set(existingSlugs);
  if (!used.has(base)) return base;
  let n = 2;
  while (used.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

export function centersDir(root) {
  return path.join(root, "data/centers");
}

export function readCentersManifest(root) {
  return JSON.parse(fs.readFileSync(path.join(centersDir(root), "manifest.json"), "utf8"));
}

export function writeCentersManifest(root, manifest) {
  fs.writeFileSync(
    path.join(centersDir(root), "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );
}

export function getCenterContentLocales(root) {
  const manifest = readCentersManifest(root);
  if (!Array.isArray(manifest.contentLocales) || manifest.contentLocales.length === 0) {
    throw new Error("data/centers/manifest.json: contentLocales must be a non-empty array");
  }
  return manifest.contentLocales;
}

export function centerDataDir(root, slug) {
  return path.join(centersDir(root), slug);
}

export async function readCenter(root, slug) {
  const contentLocales = getCenterContentLocales(root);
  const dir = centerDataDir(root, slug);
  const t = Date.now();
  const metaMod = await import(`${pathToFileURL(path.join(dir, "meta.js")).href}?t=${t}`);
  const slices = {};
  for (const loc of contentLocales) {
    const locPath = path.join(dir, `${loc}.js`);
    if (!fs.existsSync(locPath)) continue;
    const mod = await import(`${pathToFileURL(locPath).href}?t=${t}`);
    slices[loc] = mod.default;
  }
  return mergeCenterRecord(metaMod.default, slices, contentLocales);
}

function blockToLocale(block, locale) {
  if (block.type === "heading") {
    return {
      id: block.id,
      type: "heading",
      level: block.level,
      text: block.text?.[locale] ?? "",
    };
  }
  if (block.type === "paragraph") {
    return {
      id: block.id,
      type: "paragraph",
      text: block.text?.[locale] ?? "",
    };
  }
  return {
    id: block.id,
    type: "list",
    ...(block.ordered ? { ordered: true } : {}),
    items: block.items?.[locale] ?? [],
  };
}

function extractCenterLocaleSlice(record, locale) {
  return {
    nav: {
      label: record.nav?.label?.[locale] ?? "",
    },
    page: {
      eyebrow: record.page?.eyebrow?.[locale] ?? "",
      title: record.page?.title?.[locale] ?? "",
      summary: record.page?.summary?.[locale] ?? "",
    },
    parking: record.parking?.[locale] ?? "",
    extraInfo: record.extraInfo?.[locale] ?? [],
    blocks: (record.blocks ?? []).map((block) => blockToLocale(block, locale)),
    imageAlt: {
      hero: record.imageAlt?.hero?.[locale] ?? "",
      gallery: record.imageAlt?.gallery?.[locale] ?? {},
    },
  };
}

function writeJsModule(filePath, comment, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const body = `export default ${JSON.stringify(data, null, 2)};\n`;
  fs.writeFileSync(filePath, `// ${comment}\n${body}`, "utf8");
}

export function writeCenter(root, slug, record) {
  const dir = centerDataDir(root, slug);
  const contentLocales = getCenterContentLocales(root);
  const primary = contentLocales[0] ?? "en";
  const label = record.nav?.label?.[primary] ?? slug;
  writeJsModule(path.join(dir, "meta.js"), `${label} — 공통 메타`, {
    slug: record.slug,
    contactRef: record.contactRef,
    hero: record.hero,
    ...(record.defaultHero ? { defaultHero: true } : {}),
    gallery: record.gallery ?? [],
    mapRef: record.mapRef,
  });
  for (const loc of contentLocales) {
    writeJsModule(
      path.join(dir, `${loc}.js`),
      `${label} — ${loc} locale`,
      extractCenterLocaleSlice(record, loc),
    );
  }
}

export function makeCenterSlug(displayName, existingSlugs) {
  return slugFromDisplayName(displayName, existingSlugs);
}

export function createCenterTemplate(root, slug, displayName) {
  const locales = getCenterContentLocales(root);
  const map = (value = "") => Object.fromEntries(locales.map((id) => [id, value]));
  const listMap = () => Object.fromEntries(locales.map((id) => [id, []]));
  const name = Object.fromEntries(locales.map((id) => [id, displayName]));
  return {
    slug,
    contactRef: slug,
    mapRef: slug,
    hero: `/centers/${slug}/hero.png`,
    defaultHero: true,
    gallery: [],
    nav: { label: name },
    page: {
      eyebrow: map("Peace & Hope Mental Health Services"),
      title: name,
      summary: map(""),
    },
    parking: map(""),
    extraInfo: listMap(),
    blocks: [
      {
        id: `blk-${Date.now().toString(36)}`,
        type: "paragraph",
        text: map(""),
      },
    ],
    imageAlt: {
      hero: name,
      gallery: Object.fromEntries(locales.map((id) => [id, {}])),
    },
  };
}

export function archiveCenterImages(root, slug) {
  const dir = path.join(root, "public/centers", slug);
  if (!fs.existsSync(dir)) return;
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const archiveAbs = path.join(root, "public/centers/_archived", `${slug}-${stamp}`);
  fs.mkdirSync(path.dirname(archiveAbs), { recursive: true });
  fs.renameSync(dir, archiveAbs);
}

export function deleteCenterFiles(root, slug) {
  const dir = centerDataDir(root, slug);
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

export async function clearDefaultCenterHeroFlag(root, slug) {
  const record = await readCenter(root, slug);
  if (!record.defaultHero) return;
  writeCenter(root, slug, { ...record, defaultHero: false });
}

export async function restoreDefaultCenterHero(root, slug) {
  const record = await readCenter(root, slug);
  const heroPath = path.join(root, "public/centers", slug, "hero.png");
  if (fs.existsSync(heroPath)) {
    const archiveRel = buildImageHistoryBackupPath(`public/centers/${slug}/hero.png`);
    const archiveAbs = path.join(root, archiveRel);
    fs.mkdirSync(path.dirname(archiveAbs), { recursive: true });
    fs.renameSync(heroPath, archiveAbs);
  }
  writeCenter(root, slug, { ...record, defaultHero: true });
}

export async function regenerateCenterRegistry(root) {
  const manifest = readCentersManifest(root);
  const contentLocales = manifest.contentLocales ?? [];
  const lines = [];
  const varNames = new Map();
  const toIdent = (slug, suffix) =>
    `${slug.replace(/[^a-zA-Z0-9]+(.)?/g, (_, c) => (c ? c.toUpperCase() : "")).replace(/^[^a-zA-Z_]/, "center")}${suffix}`;

  for (const slug of manifest.order) {
    const base = toIdent(slug, "");
    const vars = { meta: `${base}Meta`, locales: {} };
    lines.push(`import ${vars.meta} from "@/data/centers/${slug}/meta.js";`);
    for (const loc of contentLocales) {
      const name = `${base}${loc[0].toUpperCase()}${loc.slice(1)}`;
      vars.locales[loc] = name;
      lines.push(`import ${name} from "@/data/centers/${slug}/${loc}.js";`);
    }
    varNames.set(slug, vars);
  }

  lines.push('import { mergeCenterRecord } from "@/lib/centers/merge-record";');
  lines.push('import type { CenterLocaleSlice, CenterMeta } from "@/lib/centers/merge-record";');
  lines.push('import type { CenterRecord } from "@/lib/centers/types";');
  lines.push("");
  lines.push("function loadCenter(");
  lines.push("  meta: CenterMeta,");
  lines.push("  locales: Record<string, CenterLocaleSlice>,");
  lines.push("): CenterRecord {");
  lines.push("  return mergeCenterRecord(meta, locales);");
  lines.push("}");
  lines.push("");
  lines.push("/** edit-server가 Center 추가·삭제·이름변경 시 이 파일을 자동 재생성한다. 수동 편집 금지. */");
  lines.push("export const centerRecordsBySlug: Record<string, CenterRecord> = {");
  for (const slug of manifest.order) {
    const vars = varNames.get(slug);
    lines.push(`  "${slug}": loadCenter(${vars.meta}, {`);
    for (const loc of contentLocales) {
      lines.push(`    ${loc}: ${vars.locales[loc]} as CenterLocaleSlice,`);
    }
    lines.push("  }),");
  }
  lines.push("};");
  fs.writeFileSync(
    path.join(root, "lib/centers/registry.ts"),
    `// manifest 순서에 맞춘 Center 모듈 정적 import (빌드 번들용)\n${lines.join("\n")}\n`,
    "utf8",
  );
}

function mergeCenterRecord(meta, slices, contentLocales) {
  const pick = (loc) => slices[loc];
  const mapString = (fn) =>
    Object.fromEntries(contentLocales.map((loc) => [loc, fn(pick(loc)) ?? ""]));
  const template =
    contentLocales.map((loc) => pick(loc)?.blocks ?? []).find((blocks) => blocks.length) ?? [];
  const blocks = template.map((ref) => {
    if (ref.type === "heading") {
      return {
        id: ref.id,
        type: "heading",
        level: ref.level,
        text: Object.fromEntries(
          contentLocales.map((loc) => [
            loc,
            pick(loc)?.blocks.find((b) => b.id === ref.id && b.type === "heading")?.text ?? "",
          ]),
        ),
      };
    }
    if (ref.type === "paragraph") {
      return {
        id: ref.id,
        type: "paragraph",
        text: Object.fromEntries(
          contentLocales.map((loc) => [
            loc,
            pick(loc)?.blocks.find((b) => b.id === ref.id && b.type === "paragraph")?.text ?? "",
          ]),
        ),
      };
    }
    return {
      id: ref.id,
      type: "list",
      ordered: ref.ordered ?? false,
      items: Object.fromEntries(
        contentLocales.map((loc) => [
          loc,
          pick(loc)?.blocks.find((b) => b.id === ref.id && b.type === "list")?.items ?? [],
        ]),
      ),
    };
  });
  return {
    slug: meta.slug,
    contactRef: meta.contactRef,
    mapRef: meta.mapRef,
    hero: meta.hero,
    ...(meta.defaultHero ? { defaultHero: true } : {}),
    gallery: meta.gallery ?? [],
    nav: { label: mapString((slice) => slice?.nav?.label ?? "") },
    page: {
      eyebrow: mapString((slice) => slice?.page?.eyebrow ?? ""),
      title: mapString((slice) => slice?.page?.title ?? ""),
      summary: mapString((slice) => slice?.page?.summary ?? ""),
    },
    parking: mapString((slice) => slice?.parking ?? ""),
    extraInfo: Object.fromEntries(contentLocales.map((loc) => [loc, pick(loc)?.extraInfo ?? []])),
    blocks,
    imageAlt: {
      hero: mapString((slice) => slice?.imageAlt?.hero ?? ""),
      gallery: Object.fromEntries(
        contentLocales.map((loc) => [loc, pick(loc)?.imageAlt?.gallery ?? {}]),
      ),
    },
  };
}
