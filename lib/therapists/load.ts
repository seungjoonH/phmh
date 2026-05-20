// 상담사 데이터 로드 (manifest 순서 + registry)
import type { ContentLocale } from "@/lib/content-blocks/types";
import {
  getTherapistContentLocaleIds,
  getTherapistSlugsOrdered,
} from "@/lib/therapists/manifest";
import { getTherapistRecord } from "@/lib/therapists/runtime";
import type { TherapistRecord } from "@/lib/therapists/types";
import { isTherapistProfileHidden, isTherapistsListHidden } from "@/lib/site-pages-visibility";

export function getTherapistBySlug(slug: string): TherapistRecord | undefined {
  return getTherapistRecord(slug);
}

export function getAllTherapists(): TherapistRecord[] {
  return getTherapistSlugsOrdered()
    .map((slug) => getTherapistRecord(slug))
    .filter((t): t is TherapistRecord => Boolean(t));
}

/** 목록·nav용 — 목록 숨김이면 [], 개별 hidden은 제외 */
export function getVisibleTherapists(): TherapistRecord[] {
  if (isTherapistsListHidden()) return [];
  return getAllTherapists().filter((t) => !isTherapistProfileHidden(t.slug));
}

/** 정적 빌드용 slug */
export function getBuildableTherapistSlugs(): string[] {
  if (isTherapistsListHidden()) return [];
  return getTherapistSlugsOrdered().filter((slug) => !isTherapistProfileHidden(slug));
}

export function pickLocale<T extends string | string[]>(
  map: Record<ContentLocale, T>,
  locale: ContentLocale,
): T {
  const primary = getTherapistContentLocaleIds()[0] as ContentLocale | undefined;
  return map[locale] ?? (primary ? map[primary] : undefined) ?? Object.values(map)[0];
}
