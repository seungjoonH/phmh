// Center 데이터 로드 (manifest 순서 + registry)
import type { ContentLocale } from "@/lib/content-blocks/types";
import {
  getCenterContentLocaleIds,
  getCenterSlugsOrdered,
} from "@/lib/centers/manifest";
import { getCenterRecord } from "@/lib/centers/runtime";
import type { CenterRecord } from "@/lib/centers/types";
import {
  isCenterProfileHidden,
  isCentersListHidden,
} from "@/lib/site-pages-visibility";

export function getCenterBySlug(slug: string): CenterRecord | undefined {
  return getCenterRecord(slug);
}

export function getAllCenters(): CenterRecord[] {
  return getCenterSlugsOrdered()
    .map((slug) => getCenterRecord(slug))
    .filter((center): center is CenterRecord => Boolean(center));
}

export function getVisibleCenters(): CenterRecord[] {
  if (isCentersListHidden()) return [];
  return getAllCenters().filter((center) => !isCenterProfileHidden(center.slug));
}

export function getBuildableCenterSlugs(): string[] {
  if (isCentersListHidden()) return [];
  return getCenterSlugsOrdered().filter((slug) => !isCenterProfileHidden(slug));
}

export function pickCenterLocale<T extends string | string[] | Record<string, string>>(
  map: Record<ContentLocale, T>,
  locale: ContentLocale,
): T {
  const primary = getCenterContentLocaleIds()[0] as ContentLocale | undefined;
  return map[locale] ?? (primary ? map[primary] : undefined) ?? Object.values(map)[0];
}
