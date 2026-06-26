// 편집 가능 이미지 키 → 파일 경로
import { pageHeroes } from "@/lib/page-heroes";
import { areaImages, therapyImages } from "@/lib/service-images";
import { siteAssets } from "@/lib/site-assets";
import { getCenterSlugsOrdered } from "@/lib/centers/manifest";
import { getTherapistSlugsOrdered } from "@/lib/therapists/manifest";

export type ImageRegistryEntry = {
  /** repo 루트 기준 상대 경로 */
  file: string;
  /** 브라우저 src */
  publicPath: string;
  /** alt locale 키 (있으면 패널에서 함께 편집) */
  altKey?: string;
};

function fromPublic(publicPath: string): ImageRegistryEntry {
  return { file: `public${publicPath}`, publicPath };
}

const heroEntries = Object.fromEntries(
  Object.entries(pageHeroes).map(([k, v]) => [`heroes.${k}`, fromPublic(v)]),
) as Record<string, ImageRegistryEntry>;

const therapyEntries = Object.fromEntries(
  Object.entries(therapyImages).map(([k, v]) => [`therapy.${k}`, fromPublic(v)]),
);

const areaEntries = Object.fromEntries(
  Object.entries(areaImages).map(([k, v]) => [`area.${k}`, fromPublic(v)]),
);

const therapistPortraitEntries = Object.fromEntries(
  getTherapistSlugsOrdered().map((slug) => [
    `therapists.${slug}.portrait`,
    fromPublic(`/therapists/${slug}/portrait.png`),
  ]),
);

const centerHeroEntries = Object.fromEntries(
  getCenterSlugsOrdered().map((slug) => [
    `centers.${slug}.hero`,
    fromPublic(`/centers/${slug}/hero.png`),
  ]),
);

export const IMAGE_REGISTRY: Record<string, ImageRegistryEntry> = {
  "site.logo": {
    file: "public/logo.png",
    publicPath: siteAssets.logo,
    altKey: "common.logoAlt",
  },
  "site.logoLight": {
    file: "public/logo-light.png",
    publicPath: siteAssets.logoLight,
    altKey: "common.logoAlt",
  },
  ...heroEntries,
  ...therapyEntries,
  ...areaEntries,
  ...centerHeroEntries,
  ...therapistPortraitEntries,
};

/** 신규 추가한 롱폼 섹션(therapy.sec_*, area.sec_*) — 슬러그 기반 경로 매핑 */
function longFormSectionImageEntry(key: string): ImageRegistryEntry | undefined {
  const match = /^(therapy|area)\.(sec_[a-z0-9]+)$/.exec(key);
  if (!match) return undefined;
  const [, domain, slug] = match;
  const folder = domain === "therapy" ? "services" : "service-areas";
  return fromPublic(`/${folder}/${slug}.png`);
}

/** flow 안에서 동적으로 추가한 이미지 — sectionKey + blockId 조합으로 파일 경로 유추 */
function flowImageEntry(key: string): ImageRegistryEntry | undefined {
  const match = /^flow\.(.+)\.([a-z0-9]+)\.img$/i.exec(key);
  if (!match) return undefined;
  const [, sectionSlug, blockId] = match;
  const safeSlug = sectionSlug.replace(/[^a-zA-Z0-9._-]/g, "_");
  const publicPath = `/flow-uploads/${safeSlug}/${blockId}.png`;
  return { file: `public${publicPath}`, publicPath };
}

export function getImageRegistryEntry(key: string): ImageRegistryEntry | undefined {
  const hit = IMAGE_REGISTRY[key];
  if (hit) return hit;
  const portrait = /^therapists\.([a-z0-9-]+)\.portrait$/.exec(key);
  if (portrait) {
    return fromPublic(`/therapists/${portrait[1]}/portrait.png`);
  }
  const centerHero = /^centers\.([a-z0-9-]+)\.hero$/.exec(key);
  if (centerHero) {
    return fromPublic(`/centers/${centerHero[1]}/hero.png`);
  }
  const centerDefaultImage = /^centers\.([a-z0-9-]+)\.defaultImage$/.exec(key);
  if (centerDefaultImage) {
    return fromPublic(`/centers/${centerDefaultImage[1]}/gallery/01.png`);
  }
  const longForm = longFormSectionImageEntry(key);
  if (longForm) return longForm;
  const flow = flowImageEntry(key);
  if (flow) return flow;
  return undefined;
}

export type PageHeroKey = keyof typeof pageHeroes;

export function heroImageKey(name: PageHeroKey): string {
  return `heroes.${name}`;
}

/** flow 안 동적 이미지 키 — sectionKey + blockId */
export function flowImageKey(sectionKey: string, blockId: string): string {
  return `flow.${sectionKey}.${blockId}.img`;
}

/** flow 동적 이미지 키의 publicPath (없으면 undefined) */
export function flowImagePublicPath(key: string): string | undefined {
  return flowImageEntry(key)?.publicPath;
}

/** registry 키 → publicPath (정적·flow·롱폼 sec_* 포함) */
export function imageRegistryPublicPath(key: string): string | undefined {
  return getImageRegistryEntry(key)?.publicPath;
}
