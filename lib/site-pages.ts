// 사이트 페이지 ID·경로 레지스트리
export type StaticSitePageId =
  | "about.who-we-are"
  | "about.our-vision"
  | "services.types"
  | "services.areas"
  | "getting-started"
  | "fee.fee"
  | "fee.online-payment"
  | "contact.korea"
  | "contact.philippines"
  | "therapists.list";

export type SitePageId = StaticSitePageId | `therapists.profile.${string}`;

export type SitePageGroup = "about" | "services" | "fee" | "contact";

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
  { id: "contact", label: "Contact Us" },
];

export function getPageGroupId(pageId: SitePageId): SitePageGroup | null {
  const entry = STATIC_SITE_PAGES.find((p) => p.id === pageId);
  if (entry?.group && entry.group !== "therapists") return entry.group;
  return null;
}

export const STATIC_SITE_PAGES: SitePageEntry[] = [
  { id: "about.who-we-are", path: "/about/who-we-are", label: "Who We Are", group: "about" },
  { id: "about.our-vision", path: "/about/our-vision", label: "Our Vision", group: "about" },
  { id: "services.types", path: "/services/types", label: "Types of Services", group: "services" },
  { id: "services.areas", path: "/services/areas", label: "Service Areas", group: "services" },
  { id: "getting-started", path: "/getting-started", label: "Getting Started", group: undefined },
  { id: "fee.fee", path: "/fee/fee", label: "Fee", group: "fee" },
  { id: "fee.online-payment", path: "/fee/online-payment", label: "Online payment", group: "fee" },
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

export function therapistProfilePageId(slug: string): SitePageId {
  return `therapists.profile.${slug}`;
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

  const profileMatch = /^\/therapists\/([^/]+)$/.exec(normalized);
  if (profileMatch) {
    return therapistProfilePageId(profileMatch[1]);
  }

  return null;
}
