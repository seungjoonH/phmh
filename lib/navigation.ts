// 헤더·푸터 내비게이션 단일 소스
import type { ContentLocale } from "@/lib/content-blocks/types";
import { getContactPath, type Locale } from "./contact";
import { getTherapistBySlug, getVisibleTherapists, pickLocale } from "@/lib/therapists/load";
import {
  isPageHidden,
  shouldShowTherapistsNav,
} from "@/lib/site-pages-visibility";
import type { SitePageId } from "@/lib/site-pages";

export type NavChild = {
  href: string;
  labelKey?: string;
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
  "/fee/online-payment": "fee.online-payment",
  "/contact-us/korea-center": "contact.korea",
  "/contact-us/philippines-center": "contact.philippines",
  "/therapists": "therapists.list",
};

function isHrefVisible(href: string): boolean {
  const pageId = PAGE_ID_BY_HREF[href];
  if (!pageId) return true;
  return !isPageHidden(pageId);
}

function navChildLabel(
  child: NavChild,
  t: (k: string) => string,
  contentLocale: ContentLocale,
): string {
  if (child.therapistSlug) {
    const record = getTherapistBySlug(child.therapistSlug);
    if (record) return pickLocale(record.list.name, contentLocale);
  }
  if (child.labelKey) return t(child.labelKey);
  return "";
}

export function getNavigation(locale: Locale): NavItem[] {
  const items: NavItem[] = [];

  const aboutChildren: NavChild[] = [
    { labelKey: "nav.whoWeAre", href: "/about/who-we-are" },
    { labelKey: "nav.ourVision", href: "/about/our-vision" },
  ].filter((c) => isHrefVisible(c.href));

  if (aboutChildren.length > 0) {
    items.push({
      labelKey: "nav.about",
      href: aboutChildren[0].href,
      children: aboutChildren,
    });
  }

  const servicesChildren: NavChild[] = [
    { labelKey: "nav.typesOfServices", href: "/services/types" },
    { labelKey: "nav.serviceAreas", href: "/services/areas" },
  ].filter((c) => isHrefVisible(c.href));

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

  const feeChildren: NavChild[] = [
    { labelKey: "nav.feePage", href: "/fee/fee" },
    { labelKey: "nav.onlinePayment", href: "/fee/online-payment" },
  ].filter((c) => isHrefVisible(c.href));

  if (feeChildren.length > 0) {
    items.push({
      labelKey: "nav.fee",
      href: feeChildren[0].href,
      children: feeChildren,
    });
  }

  const contactChildren: NavChild[] = [
    { labelKey: "nav.koreaCenter", href: "/contact-us/korea-center" },
    { labelKey: "nav.philippinesCenter", href: "/contact-us/philippines-center" },
  ].filter((c) => isHrefVisible(c.href));

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

  return items;
}

/** SiteHeader에서 nav child 라벨 표시 */
export { navChildLabel };
