// 편집 가능 이미지 키 → 파일 경로
import { pageHeroes } from "@/lib/page-heroes";
import { areaImages, therapyImages } from "@/lib/service-images";
import { siteAssets } from "@/lib/site-assets";
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
  ...therapistPortraitEntries,
};

export function getImageRegistryEntry(key: string): ImageRegistryEntry | undefined {
  const hit = IMAGE_REGISTRY[key];
  if (hit) return hit;
  const portrait = /^therapists\.([a-z0-9-]+)\.portrait$/.exec(key);
  if (portrait) {
    return fromPublic(`/therapists/${portrait[1]}/portrait.png`);
  }
  return undefined;
}

export type PageHeroKey = keyof typeof pageHeroes;

export function heroImageKey(name: PageHeroKey): string {
  return `heroes.${name}`;
}
