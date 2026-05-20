// manifest 순서에 맞춘 상담사 모듈 정적 import (빌드 번들용)
import drErinEn from "@/data/therapists/dr-erin-cho-ph-d/en.js";
import drErinJp from "@/data/therapists/dr-erin-cho-ph-d/jp.js";
import drErinKo from "@/data/therapists/dr-erin-cho-ph-d/ko.js";
import drErinMeta from "@/data/therapists/dr-erin-cho-ph-d/meta.js";
import drMayaEn from "@/data/therapists/dr-maya-han-ph-d/en.js";
import drMayaJp from "@/data/therapists/dr-maya-han-ph-d/jp.js";
import drMayaKo from "@/data/therapists/dr-maya-han-ph-d/ko.js";
import drMayaMeta from "@/data/therapists/dr-maya-han-ph-d/meta.js";
import drNoahEn from "@/data/therapists/dr-noah-bennett-ph-d/en.js";
import drNoahJp from "@/data/therapists/dr-noah-bennett-ph-d/jp.js";
import drNoahKo from "@/data/therapists/dr-noah-bennett-ph-d/ko.js";
import drNoahMeta from "@/data/therapists/dr-noah-bennett-ph-d/meta.js";
import { mergeTherapistRecord } from "@/lib/therapists/merge-record";
import type { TherapistLocaleSlice, TherapistMeta } from "@/lib/therapists/merge-record";
import type { TherapistRecord } from "@/lib/therapists/types";

function loadTherapist(
  meta: TherapistMeta,
  locales: Record<string, TherapistLocaleSlice>,
): TherapistRecord {
  return mergeTherapistRecord(meta, locales);
}

/** edit로 slug 추가 시 meta·{locale}.js import(manifest contentLocales)와 여기 항목 추가 후 `pnpm run build` */
export const therapistRecordsBySlug: Record<string, TherapistRecord> = {
  "dr-maya-han-ph-d": loadTherapist(drMayaMeta, {
    en: drMayaEn as TherapistLocaleSlice,
    ko: drMayaKo as TherapistLocaleSlice,
    jp: drMayaJp as TherapistLocaleSlice,
  }),
  "dr-erin-cho-ph-d": loadTherapist(drErinMeta, {
    en: drErinEn as TherapistLocaleSlice,
    ko: drErinKo as TherapistLocaleSlice,
    jp: drErinJp as TherapistLocaleSlice,
  }),
  "dr-noah-bennett-ph-d": loadTherapist(drNoahMeta, {
    en: drNoahEn as TherapistLocaleSlice,
    ko: drNoahKo as TherapistLocaleSlice,
    jp: drNoahJp as TherapistLocaleSlice,
  }),
};
