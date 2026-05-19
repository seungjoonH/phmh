// 헤더·푸터 내비게이션 단일 소스
import { getContactPath, type Locale } from "./contact";

export type NavChild = { labelKey: string; href: string };
export type NavItem =
  | { labelKey: string; href: string; children?: never }
  | { labelKey: string; href: string; children: NavChild[] };

export function getNavigation(locale: Locale): NavItem[] {
  return [
    {
      labelKey: "nav.about",
      href: "/about/who-we-are",
      children: [
        { labelKey: "nav.whoWeAre", href: "/about/who-we-are" },
        { labelKey: "nav.ourVision", href: "/about/our-vision" },
      ],
    },
    {
      labelKey: "nav.services",
      href: "/services/types",
      children: [
        { labelKey: "nav.typesOfServices", href: "/services/types" },
        { labelKey: "nav.serviceAreas", href: "/services/areas" },
      ],
    },
    { labelKey: "nav.gettingStarted", href: "/getting-started" },
    {
      labelKey: "nav.fee",
      href: "/fee/fee",
      children: [
        { labelKey: "nav.feePage", href: "/fee/fee" },
        { labelKey: "nav.onlinePayment", href: "/fee/online-payment" },
      ],
    },
    {
      labelKey: "nav.contact",
      href: getContactPath(locale),
      children: [
        { labelKey: "nav.koreaCenter", href: "/contact-us/korea-center" },
        {
          labelKey: "nav.philippinesCenter",
          href: "/contact-us/philippines-center",
        },
      ],
    },
  ];
}

