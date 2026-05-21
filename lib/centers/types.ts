// Center 데이터 파일 스키마 타입
import type { ContentBlock, LocaleMap } from "@/lib/content-blocks/types";

export type CenterContactRef = "korea" | "philippines" | string;

export type CenterGalleryImage = {
  id: string;
  src: string;
};

export type CenterRecord = {
  slug: string;
  contactRef: CenterContactRef;
  mapRef: CenterContactRef;
  hero: string;
  defaultHero?: boolean;
  gallery: CenterGalleryImage[];
  nav: {
    label: LocaleMap;
  };
  page: {
    eyebrow: LocaleMap;
    title: LocaleMap;
    summary: LocaleMap;
  };
  parking: LocaleMap;
  extraInfo: LocaleMap<string[]>;
  blocks: ContentBlock[];
  imageAlt: {
    hero: LocaleMap;
    gallery: LocaleMap<Record<string, string>>;
  };
};

export type CentersManifest = {
  contentLocales: string[];
  order: string[];
  entries: Record<
    string,
    {
      createdAt: string;
      sourceName: string;
    }
  >;
};
