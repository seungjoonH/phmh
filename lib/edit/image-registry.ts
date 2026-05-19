// 편집 가능 이미지 키 → 파일 경로
import { pageHeroes } from "@/lib/page-heroes";
import { areaImages, therapyImages } from "@/lib/service-images";
import { siteAssets } from "@/lib/site-assets";

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
};

export function getImageRegistryEntry(key: string): ImageRegistryEntry | undefined {
  return IMAGE_REGISTRY[key];
}

export type PageHeroKey = keyof typeof pageHeroes;

export function heroImageKey(name: PageHeroKey): string {
  return `heroes.${name}`;
}
