// 페이지 노출(숨김) SSOT
import visibilityJson from "@/data/site-pages-visibility.json";
import { getTherapistSlugsOrdered } from "@/lib/therapists/manifest";
import {
  getPageGroupId,
  therapistProfilePageId,
  type SitePageId,
  type StaticSitePageId,
} from "@/lib/site-pages";

type VisibilityFile = { hidden: string[] };

let cachedHidden: Set<string> | null = null;
let runtimeHidden: Set<string> | null = null;

function getHiddenSet(): Set<string> {
  if (runtimeHidden) return runtimeHidden;
  if (!cachedHidden) {
    cachedHidden = new Set((visibilityJson as VisibilityFile).hidden);
  }
  return cachedHidden;
}

/** edit-server가 파일을 갱신한 뒤 HMR용 */
export function resetVisibilityCache(): void {
  cachedHidden = null;
}

/** 편집 모드 draft — 디스크 반영 전 미리보기 */
export function setRuntimeVisibility(hidden: string[]): void {
  runtimeHidden = new Set(hidden);
}

export function clearRuntimeVisibility(): void {
  runtimeHidden = null;
}

export function isPageHidden(pageId: SitePageId): boolean {
  const hidden = getHiddenSet();
  if (hidden.has(pageId)) return true;
  const groupId = getPageGroupId(pageId);
  if (groupId && hidden.has(groupId)) return true;
  if (pageId.startsWith("therapists.profile.") && hidden.has("therapists.list")) {
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
    "fee.online-payment",
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
