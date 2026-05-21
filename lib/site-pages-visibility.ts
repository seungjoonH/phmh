// 페이지 노출(숨김) + 순서 SSOT
import visibilityJson from "@/data/site-pages-visibility.json";
import { getCenterSlugsOrdered } from "@/lib/centers/manifest";
import { getTherapistSlugsOrdered } from "@/lib/therapists/manifest";
import {
  DEFAULT_GROUP_ORDER,
  DEFAULT_TOP_ORDER,
  centerProfilePageId,
  getPageGroupId,
  isSitePageGroup,
  therapistProfilePageId,
  type SitePageGroup,
  type SitePageId,
  type SiteTopEntryId,
  type StaticSitePageId,
} from "@/lib/site-pages";

type VisibilityFile = {
  hidden: string[];
  topOrder?: string[];
  groupOrder?: Partial<Record<SitePageGroup, string[]>>;
};

let cachedHidden: Set<string> | null = null;
let cachedTopOrder: SiteTopEntryId[] | null = null;
let cachedGroupOrder: Record<SitePageGroup, string[]> | null = null;
let runtimeHidden: Set<string> | null = null;
let runtimeTopOrder: SiteTopEntryId[] | null = null;
let runtimeGroupOrder: Record<SitePageGroup, string[]> | null = null;

function getHiddenSet(): Set<string> {
  if (runtimeHidden) return runtimeHidden;
  if (!cachedHidden) {
    cachedHidden = new Set((visibilityJson as VisibilityFile).hidden);
  }
  return cachedHidden;
}

function isSiteTopEntryId(value: string): value is SiteTopEntryId {
  return (
    isSitePageGroup(value) ||
    value === "getting-started" ||
    value === "therapists.list"
  );
}

function normalizeTopOrder(input: readonly string[] | undefined): SiteTopEntryId[] {
  const seen = new Set<SiteTopEntryId>();
  const ordered: SiteTopEntryId[] = [];
  for (const value of input ?? []) {
    if (!isSiteTopEntryId(value) || seen.has(value)) continue;
    seen.add(value);
    ordered.push(value);
  }
  for (const fallback of DEFAULT_TOP_ORDER) {
    if (!seen.has(fallback)) {
      seen.add(fallback);
      ordered.push(fallback);
    }
  }
  return ordered;
}

function normalizeGroupOrder(
  input: Partial<Record<SitePageGroup, string[]>> | undefined,
): Record<SitePageGroup, string[]> {
  const result = {} as Record<SitePageGroup, string[]>;
  for (const group of Object.keys(DEFAULT_GROUP_ORDER) as SitePageGroup[]) {
    const defaults = DEFAULT_GROUP_ORDER[group] as string[];
    const provided = input?.[group] ?? [];
    const seen = new Set<string>();
    const ordered: string[] = [];
    for (const id of provided) {
      if (!defaults.includes(id) || seen.has(id)) continue;
      seen.add(id);
      ordered.push(id);
    }
    for (const id of defaults) {
      if (!seen.has(id)) {
        seen.add(id);
        ordered.push(id);
      }
    }
    result[group] = ordered;
  }
  return result;
}

function getTopOrderInternal(): SiteTopEntryId[] {
  if (runtimeTopOrder) return runtimeTopOrder;
  if (!cachedTopOrder) {
    cachedTopOrder = normalizeTopOrder((visibilityJson as VisibilityFile).topOrder);
  }
  return cachedTopOrder;
}

function getGroupOrderInternal(): Record<SitePageGroup, string[]> {
  if (runtimeGroupOrder) return runtimeGroupOrder;
  if (!cachedGroupOrder) {
    cachedGroupOrder = normalizeGroupOrder((visibilityJson as VisibilityFile).groupOrder);
  }
  return cachedGroupOrder;
}

export function getSiteTopOrder(): SiteTopEntryId[] {
  return [...getTopOrderInternal()];
}

export function getSiteGroupOrder(group: SitePageGroup): SitePageId[] {
  return getGroupOrderInternal()[group].slice() as SitePageId[];
}

/** edit-server가 파일을 갱신한 뒤 HMR용 */
export function resetVisibilityCache(): void {
  cachedHidden = null;
  cachedTopOrder = null;
  cachedGroupOrder = null;
}

/** 편집 모드 draft — 디스크 반영 전 미리보기 */
export function setRuntimeVisibility(hidden: string[]): void {
  runtimeHidden = new Set(hidden);
}

export function clearRuntimeVisibility(): void {
  runtimeHidden = null;
}

export function setRuntimeSiteOrder(input: {
  topOrder?: string[];
  groupOrder?: Partial<Record<SitePageGroup, string[]>>;
}): void {
  if (input.topOrder !== undefined) {
    runtimeTopOrder = normalizeTopOrder(input.topOrder);
  }
  if (input.groupOrder !== undefined) {
    runtimeGroupOrder = normalizeGroupOrder(input.groupOrder);
  }
}

export function clearRuntimeSiteOrder(): void {
  runtimeTopOrder = null;
  runtimeGroupOrder = null;
}

export function isPageHidden(pageId: SitePageId): boolean {
  const hidden = getHiddenSet();
  if (hidden.has(pageId)) return true;
  const groupId = getPageGroupId(pageId);
  if (groupId && hidden.has(groupId)) return true;
  if (pageId.startsWith("therapists.profile.") && hidden.has("therapists.list")) {
    return true;
  }
  if (pageId.startsWith("centers.profile.") && hidden.has("centers.list")) {
    return true;
  }
  return false;
}

export function isPageGroupHidden(groupId: string): boolean {
  return getHiddenSet().has(groupId);
}

export function isTherapistsListHidden(): boolean {
  return isPageHidden("therapists.list");
}

export function isCentersListHidden(): boolean {
  return isPageHidden("centers.list");
}

export function isCenterProfileHidden(slug: string): boolean {
  if (isCentersListHidden()) return true;
  return isPageHidden(centerProfilePageId(slug));
}

export function getVisibleCenterSlugsForNav(): string[] {
  if (isCentersListHidden()) return [];
  return getCenterSlugsOrdered().filter((slug) => !isCenterProfileHidden(slug));
}

export function shouldShowCentersNav(): boolean {
  if (isCentersListHidden()) return false;
  return getVisibleCenterSlugsForNav().length > 0 || getCenterSlugsOrdered().length === 0;
}

export function isTherapistProfileHidden(slug: string): boolean {
  if (isTherapistsListHidden()) return true;
  return isPageHidden(therapistProfilePageId(slug));
}

export function getVisibleTherapistSlugsForNav(): string[] {
  if (isTherapistsListHidden()) return [];
  return getTherapistSlugsOrdered().filter((slug) => !isTherapistProfileHidden(slug));
}

export function shouldShowTherapistsNav(): boolean {
  if (isTherapistsListHidden()) return false;
  return getVisibleTherapistSlugsForNav().length > 0 || getTherapistSlugsOrdered().length === 0;
}

export function getAllStaticPageIds(): StaticSitePageId[] {
  return [
    "about.who-we-are",
    "about.our-vision",
    "services.types",
    "services.areas",
    "getting-started",
    "fee.fee",
    "centers.list",
    "contact.korea",
    "contact.philippines",
    "therapists.list",
  ];
}

export function getHiddenPageIds(): string[] {
  return [...getHiddenSet()];
}

export function readVisibilityFile(): VisibilityFile {
  return { hidden: getHiddenPageIds() };
}
