// 상담사 데이터 파일 스키마 타입
import type { ContentBlock, LocaleMap } from "@/lib/content-blocks/types";

export type TherapistListData = {
  name: LocaleMap;
  subtitle: LocaleMap;
  bullets: LocaleMap<string[]>;
  ctaLabel: LocaleMap;
};

export type TherapistProfileHeader = {
  name: LocaleMap;
  lines: LocaleMap<string[]>;
};

export type TherapistRecord = {
  slug: string;
  list: TherapistListData;
  profile: {
    header: TherapistProfileHeader;
    portrait: string;
    blocks: ContentBlock[];
  };
};

export type TherapistsManifest = {
  /** data/therapists/{slug}/{locale}.js 파일 목록·순서 (SSOT) */
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
