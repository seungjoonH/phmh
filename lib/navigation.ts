// 헤더·푸터 내비게이션 단일 소스
import type { ContentLocale } from "@/lib/content-blocks/types";
import { getContactPath, type Locale } from "./contact";
import { getCenterBySlug, getVisibleCenters, pickCenterLocale } from "@/lib/centers/load";
import { getTherapistBySlug, getVisibleTherapists, pickLocale } from "@/lib/therapists/load";
import {
  getSiteGroupOrder,
  getSiteTopOrder,
  isPageHidden,
  shouldShowCentersNav,
  shouldShowTherapistsNav,
} from "@/lib/site-pages-visibility";
import type { SitePageGroup, SitePageId } from "@/lib/site-pages";

export type NavChild = {
  href: string;
  labelKey?: string;
  /** Center 상세 — nav 라벨은 nav.label 과 동기화 */
  centerSlug?: string;
  /** 상담사 프로필 — nav 라벨은 list.name 과 동기화 */
  therapistSlug?: string;
};

export type NavItem =
  | { labelKey: string; href: string; children?: never }
  | { labelKey: string; href: string; children: NavChild[] };

const PAGE_ID_BY_HREF: Record<string, SitePageId> = {
  "/about/who-we-are": "about.who-we-are",
  "/about/our-vision": "about.our-vision",
  "/services/types": "services.types",
  "/services/areas": "services.areas",
  "/getting-started": "getting-started",
  "/fee/fee": "fee.fee",
  "/centers": "centers.list",
  "/contact-us/korea-center": "contact.korea",
  "/contact-us/philippines-center": "contact.philippines",
  "/therapists": "therapists.list",
};

const HREF_BY_PAGE_ID: Record<string, string> = Object.fromEntries(
  Object.entries(PAGE_ID_BY_HREF).map(([href, id]) => [id, href]),
);

function isHrefVisible(href: string): boolean {
  const pageId = PAGE_ID_BY_HREF[href];
  if (!pageId) return true;
  return !isPageHidden(pageId);
}

function sortChildrenByGroupOrder(
  children: NavChild[],
  group: SitePageGroup,
): NavChild[] {
  const order = getSiteGroupOrder(group);
  const indexOf = (c: NavChild) => {
    const pageId = c.href ? PAGE_ID_BY_HREF[c.href] : undefined;
    const i = pageId ? order.indexOf(pageId) : -1;
    return i === -1 ? Number.MAX_SAFE_INTEGER : i;
  };
  return [...children].sort((a, b) => indexOf(a) - indexOf(b));
}

function topEntryIdForItem(item: NavItem): string {
  switch (item.labelKey) {
    case "nav.about":
      return "about";
    case "nav.services":
      return "services";
    case "nav.gettingStarted":
      return "getting-started";
    case "nav.fee":
      return "fee";
    case "nav.center":
      return "center";
    case "nav.contact":
      return "contact";
    case "nav.therapists":
      return "therapists.list";
    default:
      return "";
  }
}

function sortTopItems(items: NavItem[]): NavItem[] {
  const order = getSiteTopOrder();
  const indexOf = (item: NavItem) => {
    const id = topEntryIdForItem(item);
    const i = id ? order.indexOf(id as never) : -1;
    return i === -1 ? Number.MAX_SAFE_INTEGER : i;
  };
  return [...items].sort((a, b) => indexOf(a) - indexOf(b));
}

export { HREF_BY_PAGE_ID, PAGE_ID_BY_HREF };

function navChildLabel(
  child: NavChild,
  t: (k: string) => string,
  contentLocale: ContentLocale,
): string {
  if (child.centerSlug) {
    const record = getCenterBySlug(child.centerSlug);
    if (record) return pickCenterLocale(record.nav.label, contentLocale);
  }
  if (child.therapistSlug) {
    const record = getTherapistBySlug(child.therapistSlug);
    if (record) return pickLocale(record.list.name, contentLocale);
  }
  if (child.labelKey) return t(child.labelKey);
  return "";
}

export function getNavigation(locale: Locale): NavItem[] {
  const items: NavItem[] = [];

  const aboutChildren = sortChildrenByGroupOrder(
    [
      { labelKey: "nav.whoWeAre", href: "/about/who-we-are" },
      { labelKey: "nav.ourVision", href: "/about/our-vision" },
    ],
    "about",
  ).filter((c) => isHrefVisible(c.href));

  if (aboutChildren.length > 0) {
    items.push({
      labelKey: "nav.about",
      href: aboutChildren[0].href,
      children: aboutChildren,
    });
  }

  const servicesChildren = sortChildrenByGroupOrder(
    [
      { labelKey: "nav.typesOfServices", href: "/services/types" },
      { labelKey: "nav.serviceAreas", href: "/services/areas" },
    ],
    "services",
  ).filter((c) => isHrefVisible(c.href));

  if (servicesChildren.length > 0) {
    items.push({
      labelKey: "nav.services",
      href: servicesChildren[0].href,
      children: servicesChildren,
    });
  }

  if (isHrefVisible("/getting-started")) {
    items.push({ labelKey: "nav.gettingStarted", href: "/getting-started" });
  }

  if (isHrefVisible("/fee/fee")) {
    items.push({ labelKey: "nav.fee", href: "/fee" });
  }

  if (shouldShowCentersNav() && isHrefVisible("/centers")) {
    const centerChildren: NavChild[] = getVisibleCenters().map((center) => ({
      href: `/centers/${center.slug}`,
      centerSlug: center.slug,
    }));

    items.push({
      labelKey: "nav.center",
      href: "/centers",
      ...(centerChildren.length > 0 ? { children: centerChildren } : {}),
    });
  }

  const contactChildren = sortChildrenByGroupOrder(
    [
      { labelKey: "nav.koreaCenter", href: "/contact-us/korea-center" },
      { labelKey: "nav.philippinesCenter", href: "/contact-us/philippines-center" },
    ],
    "contact",
  ).filter((c) => isHrefVisible(c.href));

  if (contactChildren.length > 0) {
    items.push({
      labelKey: "nav.contact",
      href: getContactPath(locale),
      children: contactChildren,
    });
  }

  if (shouldShowTherapistsNav() && isHrefVisible("/therapists")) {
    const therapistChildren: NavChild[] = getVisibleTherapists().map((t) => ({
      href: `/therapists/${t.slug}`,
      therapistSlug: t.slug,
    }));

    items.push({
      labelKey: "nav.therapists",
      href: "/therapists",
      ...(therapistChildren.length > 0 ? { children: therapistChildren } : {}),
    });
  }

  return sortTopItems(items);
}

/** SiteHeader에서 nav child 라벨 표시 */
export { navChildLabel };
