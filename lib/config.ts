// 사이트 전역 설정 (연락처·결제·메일·언어 SSOT)
import {
  defaultLocale,
  getVisibleLocaleOptions,
  isLocaleId,
  type LocaleId,
} from "@/lib/site-locales";

const CONTACT_EMAIL = "hsj6831@gmail.com";

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
  /** Contact 폼 Resend — 수신·발신 SSOT (개발·배포 동일) */
  mail: {
    to: CONTACT_EMAIL,
    from: `PHMH Contact <contact@${CONTACT_EMAIL.split("@")[1] ?? "phmhservices.com"}>`,
    /** 도메인 인증 전 — Resend 제공 테스트 발신 (로컬 기본) */
    fromSandbox: "PHMH Contact <onboarding@resend.dev>",
  },
  contact: {
    email: CONTACT_EMAIL,
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
  payment: {
    products: [
      {
        id: "individual-therapy-dbq",
        amountUsd: 250,
        currency: "USD",
      },
    ],
    providers: [
      { id: "paypal", enabled: false },
      { id: "stripe", enabled: false },
      { id: "toss", enabled: false },
    ],
  },
} as const;
