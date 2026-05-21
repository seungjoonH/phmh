// 사이트 페이지 ID·경로 레지스트리
export type StaticSitePageId =
  | "about.who-we-are"
  | "about.our-vision"
  | "services.types"
  | "services.areas"
  | "getting-started"
  | "fee.fee"
  | "contact.korea"
  | "contact.philippines"
  | "centers.list"
  | "therapists.list";

export type SitePageId =
  | StaticSitePageId
  | `centers.profile.${string}`
  | `therapists.profile.${string}`;

export type SitePageGroup = "about" | "services" | "fee" | "center" | "contact";

export type SitePageEntry = {
  id: SitePageId;
  path: string;
  label: string;
  group?: SitePageGroup | "therapists";
};

/** 카테고리 그룹 — 숨김 ID로 사용 (therapists는 list 노드 자체가 카테고리) */
export type SitePageGroupEntry = {
  id: SitePageGroup;
  label: string;
};

export const SITE_PAGE_GROUPS: SitePageGroupEntry[] = [
  { id: "about", label: "About" },
  { id: "services", label: "Services" },
  { id: "fee", label: "Fee" },
  { id: "center", label: "Center" },
  { id: "contact", label: "Contact Us" },
];

export function getPageGroupId(pageId: SitePageId): SitePageGroup | null {
  const entry = STATIC_SITE_PAGES.find((p) => p.id === pageId);
  if (entry?.group && entry.group !== "therapists") return entry.group;
  return null;
}

/**
 * Nav 최상위 항목 식별자.
 * - 카테고리: SitePageGroup ("about" | "services" | "fee" | "contact")
 * - 단독 페이지: SitePageId ("getting-started")
 * - 상담사 목록 노드: "therapists.list"
 */
export type SiteTopEntryId =
  | SitePageGroup
  | "getting-started"
  | "therapists.list";

export const DEFAULT_TOP_ORDER: SiteTopEntryId[] = [
  "about",
  "services",
  "getting-started",
  "fee",
  "center",
  "contact",
  "therapists.list",
];

export const DEFAULT_GROUP_ORDER: Record<SitePageGroup, StaticSitePageId[]> = {
  about: ["about.who-we-are", "about.our-vision"],
  services: ["services.types", "services.areas"],
  fee: ["fee.fee"],
  center: ["centers.list"],
  contact: ["contact.korea", "contact.philippines"],
};

export function isSitePageGroup(value: string): value is SitePageGroup {
  return value === "about" || value === "services" || value === "fee" || value === "center" || value === "contact";
}

export const STATIC_SITE_PAGES: SitePageEntry[] = [
  { id: "about.who-we-are", path: "/about/who-we-are", label: "Who We Are", group: "about" },
  { id: "about.our-vision", path: "/about/our-vision", label: "Our Vision", group: "about" },
  { id: "services.types", path: "/services/types", label: "Types of Services", group: "services" },
  { id: "services.areas", path: "/services/areas", label: "Service Areas", group: "services" },
  { id: "getting-started", path: "/getting-started", label: "Getting Started", group: undefined },
  { id: "fee.fee", path: "/fee/fee", label: "Fee", group: "fee" },
  { id: "centers.list", path: "/centers", label: "Centers", group: "center" },
  {
    id: "contact.korea",
    path: "/contact-us/korea-center",
    label: "Korea Center",
    group: "contact",
  },
  {
    id: "contact.philippines",
    path: "/contact-us/philippines-center",
    label: "Philippines Center",
    group: "contact",
  },
  { id: "therapists.list", path: "/therapists", label: "Therapists (list)", group: "therapists" },
];

export function centerProfilePageId(slug: string): SitePageId {
  return `centers.profile.${slug}`;
}

export function therapistProfilePageId(slug: string): SitePageId {
  return `therapists.profile.${slug}`;
}

export function parseCenterSlugFromPageId(pageId: SitePageId): string | null {
  const prefix = "centers.profile.";
  if (!pageId.startsWith(prefix)) return null;
  return pageId.slice(prefix.length);
}

export function parseTherapistSlugFromPageId(pageId: SitePageId): string | null {
  const prefix = "therapists.profile.";
  if (!pageId.startsWith(prefix)) return null;
  return pageId.slice(prefix.length);
}

export function getPageIdForPath(pathname: string): SitePageId | null {
  const normalized = pathname.replace(/\/$/, "") || "/";
  const staticMatch = STATIC_SITE_PAGES.find((p) => p.path === normalized);
  if (staticMatch) return staticMatch.id;

  const centerMatch = /^\/centers\/([^/]+)$/.exec(normalized);
  if (centerMatch) {
    return centerProfilePageId(centerMatch[1]);
  }

  const profileMatch = /^\/therapists\/([^/]+)$/.exec(normalized);
  if (profileMatch) {
    return therapistProfilePageId(profileMatch[1]);
  }

  return null;
}
