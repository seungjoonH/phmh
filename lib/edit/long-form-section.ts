// 롱폼 페이지(서비스 유형·관심 분야) 섹션 추가·삭제 draft 헬퍼
import { getActiveLocaleIds } from "@/lib/site-locales";

export type LongFormSectionContent = {
  title: string;
  tagline?: string;
  groups?: string[][];
  lists?: { lead?: string; items: string[] }[];
  subsections?: unknown[];
  closing?: string[];
};

export type LongFormSectionsDraftEntry = {
  /** slug → locale → 섹션 본문 객체 */
  added: Record<string, Record<string, LongFormSectionContent>>;
  /** locale 파일에서 제거할 기존 slug */
  removed: string[];
};

const NEW_SECTION_TITLE: Record<string, string> = {
  en: "New section",
  ko: "새 섹션",
  jp: "新しいセクション",
  cn: "新章节",
};

export function sectionsPathFromOrderKey(sectionOrderKey: string): string {
  if (sectionOrderKey === "services.sectionOrder") return "services.sections";
  if (sectionOrderKey === "serviceAreas.sectionOrder") return "serviceAreas.sections";
  throw new Error(`Unknown section order key: ${sectionOrderKey}`);
}

export function domainFromOrderKey(sectionOrderKey: string): "services" | "serviceAreas" {
  if (sectionOrderKey === "services.sectionOrder") return "services";
  if (sectionOrderKey === "serviceAreas.sectionOrder") return "serviceAreas";
  throw new Error(`Unknown section order key: ${sectionOrderKey}`);
}

export function generateLongFormSectionSlug(): string {
  return `sec_${Date.now().toString(36)}`;
}

export function defaultLongFormSectionContent(
  sectionOrderKey: string,
  localeId: string,
): LongFormSectionContent {
  const title = NEW_SECTION_TITLE[localeId] ?? NEW_SECTION_TITLE.en;
  if (domainFromOrderKey(sectionOrderKey) === "serviceAreas") {
    return {
      title,
      tagline: "",
      groups: [[""]],
      lists: [],
      subsections: [],
      closing: [],
    };
  }
  return {
    title,
    groups: [[""]],
    lists: [],
    closing: [],
  };
}

export function defaultLongFormSectionByLocales(
  sectionOrderKey: string,
): Record<string, LongFormSectionContent> {
  return Object.fromEntries(
    getActiveLocaleIds().map((id) => [
      id,
      defaultLongFormSectionContent(sectionOrderKey, id),
    ]),
  );
}

export function newSectionTitleDraft(
  _sectionOrderKey: string,
  _slug: string,
): Record<string, string> {
  return Object.fromEntries(
    getActiveLocaleIds().map((id) => [
      id,
      NEW_SECTION_TITLE[id] ?? NEW_SECTION_TITLE.en,
    ]),
  );
}

export function sectionTitleEditKey(
  sectionOrderKey: string,
  slug: string,
): string {
  return `${sectionsPathFromOrderKey(sectionOrderKey)}.${slug}.title`;
}
