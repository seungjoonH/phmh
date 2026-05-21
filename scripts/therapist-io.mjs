// data/therapists 파일 읽기·쓰기 (edit-server)
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import { pathToFileURL } from "url";
import { buildImageHistoryBackupPath } from "../lib/edit/image-write-path.mjs";
import { extractTherapistLocaleSlice, mergeTherapistRecord } from "./therapist-locale-merge.mjs";

/** portrait.png가 기본 placeholder(light/dark)와 byte-identical이면 true. */
function portraitMatchesDefault(root, slug) {
  const portraitPath = path.join(root, "public/therapists", slug, "portrait.png");
  if (!fs.existsSync(portraitPath)) return false;
  const portraitHash = crypto
    .createHash("md5")
    .update(fs.readFileSync(portraitPath))
    .digest("hex");
  const defaults = [
    "public/therapists/_default-portrait-light.png",
    "public/therapists/_default-portrait-dark.png",
  ];
  for (const rel of defaults) {
    const abs = path.join(root, rel);
    if (!fs.existsSync(abs)) continue;
    const hash = crypto.createHash("md5").update(fs.readFileSync(abs)).digest("hex");
    if (hash === portraitHash) return true;
  }
  return false;
}

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
  if (!base) base = `therapist-${Date.now().toString(36)}`;
  const used = new Set(existingSlugs);
  if (!used.has(base)) return base;
  let n = 2;
  while (used.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

/**
 * @param {string} root
 */
export function therapistsDir(root) {
  return path.join(root, "data/therapists");
}

/**
 * @param {string} root
 */
export function readManifest(root) {
  const raw = fs.readFileSync(path.join(therapistsDir(root), "manifest.json"), "utf8");
  return JSON.parse(raw);
}

/**
 * @param {string} root
 * @returns {readonly string[]}
 */
export function getTherapistContentLocales(root) {
  const manifest = readManifest(root);
  if (!Array.isArray(manifest.contentLocales) || manifest.contentLocales.length === 0) {
    throw new Error("data/therapists/manifest.json: contentLocales must be a non-empty array");
  }
  return manifest.contentLocales;
}

/**
 * @param {string} root
 * @param {unknown} manifest
 */
export function writeManifest(root, manifest) {
  fs.writeFileSync(
    path.join(therapistsDir(root), "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );
}

/**
 * @param {string} root
 */
export function readVisibility(root) {
  const p = path.join(root, "data/site-pages-visibility.json");
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

/**
 * @param {string} root
 * @param {{ hidden: string[] }} data
 */
export function writeVisibility(root, data) {
  fs.writeFileSync(
    path.join(root, "data/site-pages-visibility.json"),
    `${JSON.stringify(data, null, 2)}\n`,
    "utf8",
  );
}

/**
 * @param {string} root
 * @param {string} slug
 */
export function therapistDataDir(root, slug) {
  return path.join(therapistsDir(root), slug);
}

/**
 * @param {string} root
 * @param {string} slug
 */
export function isSplitTherapistLayout(root, slug) {
  return fs.existsSync(path.join(therapistDataDir(root, slug), "meta.js"));
}

/**
 * @param {string} root
 * @param {string} slug
 */
export async function readTherapist(root, slug) {
  const legacy = path.join(therapistsDir(root), `${slug}.js`);
  if (fs.existsSync(legacy) && !isSplitTherapistLayout(root, slug)) {
    const mod = await import(`${pathToFileURL(legacy).href}?t=${Date.now()}`);
    return mod.default;
  }

  const contentLocales = getTherapistContentLocales(root);
  const dir = therapistDataDir(root, slug);
  const t = Date.now();
  const metaMod = await import(`${pathToFileURL(path.join(dir, "meta.js")).href}?t=${t}`);
  const slices = {};
  for (const loc of contentLocales) {
    const locPath = path.join(dir, `${loc}.js`);
    if (!fs.existsSync(locPath)) continue;
    const mod = await import(`${pathToFileURL(locPath).href}?t=${t}`);
    slices[loc] = mod.default;
  }
  return mergeTherapistRecord(metaMod.default, slices, contentLocales);
}

/**
 * @param {string} filePath
 * @param {string} comment
 * @param {unknown} data
 */
function writeJsModule(filePath, comment, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const body = `export default ${JSON.stringify(data, null, 2)};\n`;
  fs.writeFileSync(filePath, `// ${comment}\n${body}`, "utf8");
}

/**
 * @param {string} root
 * @param {string} slug
 * @param {import('../lib/therapists/types').TherapistRecord} record
 */
export function writeTherapist(root, slug, record) {
  const dir = therapistDataDir(root, slug);
  const legacy = path.join(therapistsDir(root), `${slug}.js`);
  if (fs.existsSync(legacy)) fs.unlinkSync(legacy);

  const contentLocales = getTherapistContentLocales(root);
  const primary = contentLocales[0] ?? "en";
  const label = record.list?.name?.[primary] ?? slug;
  // defaultPortrait는 이미지 업로드(clearDefaultPortraitFlag) / 복원(restoreDefaultPortrait)으로만
  // 변경되어야 하고, 텍스트 편집 저장이 stale 한 client record로 이 플래그를 떨어뜨리면 안 된다.
  // 1) 디스크 meta.js의 값을 우선 보존
  // 2) 그래도 false면, portrait.png가 default placeholder와 byte-identical일 때 self-heal로 true 복원
  const metaPath = path.join(dir, "meta.js");
  let defaultPortrait = record.profile?.defaultPortrait === true;
  if (fs.existsSync(metaPath)) {
    try {
      const text = fs.readFileSync(metaPath, "utf8");
      if (/["']?defaultPortrait["']?\s*:\s*true\b/.test(text)) {
        defaultPortrait = true;
      }
    } catch {}
  }
  if (!defaultPortrait && portraitMatchesDefault(root, slug)) {
    defaultPortrait = true;
  }
  writeJsModule(
    metaPath,
    `${label} — 공통 메타`,
    {
      slug: record.slug,
      portrait: record.profile.portrait,
      ...(defaultPortrait ? { defaultPortrait: true } : {}),
    },
  );

  for (const loc of contentLocales) {
    const slice = extractTherapistLocaleSlice(record, loc, contentLocales);
    writeJsModule(path.join(dir, `${loc}.js`), `${label} — ${loc} locale`, slice);
  }
}

/**
 * @param {string} displayName
 * @param {string[]} existingSlugs
 */
export function makeSlug(displayName, existingSlugs) {
  return slugFromDisplayName(displayName, existingSlugs);
}

/**
 * @param {string} root
 * @param {string} slug
 * @param {string} displayName
 */
export function createTherapistTemplate(root, slug, displayName) {
  const locales = getTherapistContentLocales(root);
  const emptyMap = () => Object.fromEntries(locales.map((id) => [id, ""]));
  const emptyListMap = () => Object.fromEntries(locales.map((id) => [id, []]));
  const name = Object.fromEntries(locales.map((id) => [id, displayName]));
  const ctaDefaults = {
    en: "View bio and expertise",
    ko: "약력 및 전문 분야 보기",
    jp: "View bio and expertise",
  };
  const aboutTitle = Object.fromEntries(locales.map((id) => [id, "About Me"]));

  return {
    slug,
    list: {
      name,
      subtitle: emptyMap(),
      bullets: emptyListMap(),
      ctaLabel: Object.fromEntries(
        locales.map((id) => [id, ctaDefaults[id] ?? ctaDefaults.en ?? ""]),
      ),
    },
    profile: {
      header: { name, lines: emptyListMap() },
      portrait: `/therapists/${slug}/portrait.png`,
      defaultPortrait: true,
      blocks: [
        {
          id: `blk-${Date.now().toString(36)}`,
          type: "heading",
          level: 2,
          text: aboutTitle,
        },
        {
          id: `blk-${Date.now().toString(36)}p`,
          type: "paragraph",
          text: emptyMap(),
        },
      ],
    },
  };
}

/**
 * @param {string} root
 * @param {string} slug
 */
export function ensurePortraitPlaceholder(root, slug) {
  const dir = path.join(root, "public/therapists", slug);
  fs.mkdirSync(dir, { recursive: true });
  const dest = path.join(dir, "portrait.png");
  if (fs.existsSync(dest)) return;
  const candidates = [
    path.join(root, "public/therapists/_default-portrait-light.png"),
    path.join(root, "public/getting-started/01.png"),
  ];
  for (const src of candidates) {
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      return;
    }
  }
}

/**
 * portrait가 사용자 업로드본으로 교체되었을 때 meta.js의 defaultPortrait 플래그 제거.
 * @param {string} root
 * @param {string} slug
 */
export async function clearDefaultPortraitFlag(root, slug) {
  const dir = therapistDataDir(root, slug);
  const metaPath = path.join(dir, "meta.js");
  if (!fs.existsSync(metaPath)) return false;
  const mod = await import(`${pathToFileURL(metaPath).href}?t=${Date.now()}`);
  const current = mod.default ?? {};
  if (!current.defaultPortrait) return false;
  const text = fs.readFileSync(metaPath, "utf8");
  const commentMatch = text.match(/^\/\/\s*(.*)/);
  const comment = commentMatch?.[1]?.trim() || `${slug} — 공통 메타`;
  const next = { ...current };
  delete next.defaultPortrait;
  writeJsModule(metaPath, comment, next);
  return true;
}

/**
 * 업로드된 portrait 를 제거하고 기본 placeholder 로 되돌린다.
 * @param {string} root
 * @param {string} slug
 */
export async function restoreDefaultPortrait(root, slug) {
  const dir = path.join(root, "public/therapists", slug);
  fs.mkdirSync(dir, { recursive: true });
  const dest = path.join(dir, "portrait.png");
  if (fs.existsSync(dest)) {
    const rel = `public/therapists/${slug}/portrait.png`;
    const archiveRel = buildImageHistoryBackupPath(rel);
    const archiveAbs = path.join(root, archiveRel);
    fs.mkdirSync(path.dirname(archiveAbs), { recursive: true });
    fs.renameSync(dest, archiveAbs);
  }
  const lightDefault = path.join(root, "public/therapists/_default-portrait-light.png");
  if (fs.existsSync(lightDefault)) {
    fs.copyFileSync(lightDefault, dest);
  } else {
    ensurePortraitPlaceholder(root, slug);
  }

  const metaPath = path.join(therapistDataDir(root, slug), "meta.js");
  if (!fs.existsSync(metaPath)) return;
  const mod = await import(`${pathToFileURL(metaPath).href}?t=${Date.now()}`);
  const current = mod.default ?? {};
  const text = fs.readFileSync(metaPath, "utf8");
  const commentMatch = text.match(/^\/\/\s*(.*)/);
  const comment = commentMatch?.[1]?.trim() || `${slug} — 공통 메타`;
  const portrait = `/therapists/${slug}/portrait.png`;
  writeJsModule(metaPath, comment, {
    ...current,
    slug: current.slug ?? slug,
    portrait,
    defaultPortrait: true,
  });
}

/**
 * @param {string} root
 * @param {string} slug
 */
export function archiveTherapistImages(root, slug) {
  const dir = path.join(root, "public/therapists", slug);
  if (!fs.existsSync(dir)) return;
  const portrait = path.join(dir, "portrait.png");
  if (fs.existsSync(portrait)) {
    const rel = `public/therapists/${slug}/portrait.png`;
    const archiveRel = buildImageHistoryBackupPath(rel);
    const archiveAbs = path.join(root, archiveRel);
    fs.mkdirSync(path.dirname(archiveAbs), { recursive: true });
    fs.renameSync(portrait, archiveAbs);
  }
}

/**
 * 디렉토리·매니페스트·visibility의 slug 갱신 (record는 별도 writeTherapist로 처리)
 * @param {string} root
 * @param {string} oldSlug
 * @param {string} newSlug
 */
export function renameTherapistFiles(root, oldSlug, newSlug) {
  if (oldSlug === newSlug) return;

  const oldDataDir = therapistDataDir(root, oldSlug);
  const newDataDir = therapistDataDir(root, newSlug);
  if (fs.existsSync(newDataDir)) {
    throw new Error(`Target data directory already exists: ${newDataDir}`);
  }
  if (fs.existsSync(oldDataDir)) {
    fs.renameSync(oldDataDir, newDataDir);
  }
  const oldLegacyJs = path.join(therapistsDir(root), `${oldSlug}.js`);
  if (fs.existsSync(oldLegacyJs)) fs.unlinkSync(oldLegacyJs);

  const oldPublicDir = path.join(root, "public/therapists", oldSlug);
  const newPublicDir = path.join(root, "public/therapists", newSlug);
  if (fs.existsSync(oldPublicDir) && !fs.existsSync(newPublicDir)) {
    fs.renameSync(oldPublicDir, newPublicDir);
  }

  const manifest = readManifest(root);
  manifest.order = manifest.order.map((s) => (s === oldSlug ? newSlug : s));
  if (manifest.entries && manifest.entries[oldSlug]) {
    manifest.entries[newSlug] = manifest.entries[oldSlug];
    delete manifest.entries[oldSlug];
  }
  writeManifest(root, manifest);

  const visPath = path.join(root, "data/site-pages-visibility.json");
  if (fs.existsSync(visPath)) {
    const visibility = readVisibility(root);
    const oldId = `therapists.profile.${oldSlug}`;
    const newId = `therapists.profile.${newSlug}`;
    const hidden = (visibility.hidden ?? []).map((id) => (id === oldId ? newId : id));
    writeVisibility(root, { hidden });
  }
}

/**
 * @param {string} slug
 */
function slugToIdentifier(slug) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((seg, i) =>
      i === 0 ? seg : seg.charAt(0).toUpperCase() + seg.slice(1),
    )
    .join("");
}

/**
 * 매니페스트와 contentLocales 기준으로 lib/therapists/registry.ts 재생성.
 * edit-server가 상담사 추가·삭제·이름변경 후 매번 호출.
 * @param {string} root
 */
export function regenerateTherapistRegistry(root) {
  const manifest = readManifest(root);
  const locales = getTherapistContentLocales(root);
  const order = manifest.order ?? [];

  const importLines = [];
  const entryLines = [];

  for (const slug of order) {
    const id = slugToIdentifier(slug);
    importLines.push(
      `import ${id}Meta from "@/data/therapists/${slug}/meta.js";`,
    );
    for (const loc of locales) {
      const cap = loc.charAt(0).toUpperCase() + loc.slice(1);
      importLines.push(
        `import ${id}${cap} from "@/data/therapists/${slug}/${loc}.js";`,
      );
    }

    const slices = locales
      .map((loc) => {
        const cap = loc.charAt(0).toUpperCase() + loc.slice(1);
        return `    ${loc}: ${id}${cap} as TherapistLocaleSlice,`;
      })
      .join("\n");
    entryLines.push(
      `  "${slug}": loadTherapist(${id}Meta, {\n${slices}\n  }),`,
    );
  }

  importLines.sort();

  const body = `// manifest 순서에 맞춘 상담사 모듈 정적 import (빌드 번들용)
${importLines.join("\n")}
import { mergeTherapistRecord } from "@/lib/therapists/merge-record";
import type { TherapistLocaleSlice, TherapistMeta } from "@/lib/therapists/merge-record";
import type { TherapistRecord } from "@/lib/therapists/types";

function loadTherapist(
  meta: TherapistMeta,
  locales: Record<string, TherapistLocaleSlice>,
): TherapistRecord {
  return mergeTherapistRecord(meta, locales);
}

/** edit-server가 상담사 추가·삭제·이름변경 시 이 파일을 자동 재생성한다. 수동 편집 금지. */
export const therapistRecordsBySlug: Record<string, TherapistRecord> = {
${entryLines.join("\n")}
};
`;

  fs.writeFileSync(path.join(root, "lib/therapists/registry.ts"), body, "utf8");
}

/**
 * @param {string} root
 * @param {string} slug
 */
export function deleteTherapistFiles(root, slug) {
  const js = path.join(therapistsDir(root), `${slug}.js`);
  if (fs.existsSync(js)) fs.unlinkSync(js);
  const dataDir = therapistDataDir(root, slug);
  if (fs.existsSync(dataDir)) {
    fs.rmSync(dataDir, { recursive: true, force: true });
  }
  const publicDir = path.join(root, "public/therapists", slug);
  if (fs.existsSync(publicDir)) {
    fs.rmSync(publicDir, { recursive: true, force: true });
  }
}
