// 사이트 전역 설정 (연락처·언어) — Contact 메일 SSOT는 .env (lib/contact-mail.ts)
import {
  defaultLocale,
  getVisibleLocaleOptions,
  isLocaleId,
  type LocaleId,
} from "@/lib/site-locales";

/** 번역 파일 locale id */
export type MessageLocaleKey = LocaleId;

export { defaultLocale, getVisibleLocaleOptions as localeOptions, isLocaleId };
export type { LocaleId };

export const siteConfig = {
  siteName: "Peace & Hope Mental Health Services",
  languages: {
    default: defaultLocale,
    locales: getVisibleLocaleOptions(),
  },
  contact: {
    koreaPath: "/contact-us/korea-center",
    philippinesPath: "/contact-us/philippines-center",
    korea: {
      address:
        "81-1, Jinsaegol-gil, Chowol-eup, Gwangju-si, Gyeonggi-do, Republic of Korea",
      addressKo: "경기도 광주시 초월읍 진새골길 81-1",
    },
    philippines: {
      addressShort:
        "Abby's Apartelle, B10 L3 Unit C, Elvira St, Josefa Subd. Malabanias, Angeles",
      addressFull:
        "McArthur Highway, Brgy. Camachiles, Skytech IT Park Building A, Mabalacat, Pampanga, 2010",
      phone: "+63 952 479 1119",
      phoneViber: "+63 952 479 1119 (Viber)",
    },
  },
} as const;
