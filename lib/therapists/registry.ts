// manifest 순서에 맞춘 상담사 모듈 정적 import (빌드 번들용)
import drErinChoPhDEn from "@/data/therapists/dr-erin-cho-ph-d/en.js";
import drErinChoPhDJp from "@/data/therapists/dr-erin-cho-ph-d/jp.js";
import drErinChoPhDKo from "@/data/therapists/dr-erin-cho-ph-d/ko.js";
import drErinChoPhDMeta from "@/data/therapists/dr-erin-cho-ph-d/meta.js";
import drMayaHanEn from "@/data/therapists/dr-maya-han/en.js";
import drMayaHanJp from "@/data/therapists/dr-maya-han/jp.js";
import drMayaHanKo from "@/data/therapists/dr-maya-han/ko.js";
import drMayaHanMeta from "@/data/therapists/dr-maya-han/meta.js";
import drNoahBennettPhDEn from "@/data/therapists/dr-noah-bennett-ph-d/en.js";
import drNoahBennettPhDJp from "@/data/therapists/dr-noah-bennett-ph-d/jp.js";
import drNoahBennettPhDKo from "@/data/therapists/dr-noah-bennett-ph-d/ko.js";
import drNoahBennettPhDMeta from "@/data/therapists/dr-noah-bennett-ph-d/meta.js";
import { mergeTherapistRecord } from "@/lib/therapists/merge-record";
import type { TherapistLocaleSlice, TherapistMeta } from "@/lib/therapists/merge-record";
import type { TherapistRecord } from "@/lib/therapists/types";

function loadTherapist(
  meta: TherapistMeta,
  locales: Record<string, TherapistLocaleSlice>,
): TherapistRecord {
  return mergeTherapistRecord(meta, locales);
}

/** edit-server가 상담사 추가·삭제·이름변경 시 이 파일을 자동 재생성한다. 수동 편집 금지. */
export const therapistRecordsBySlug: Record<string, TherapistRecord> = {
  "dr-noah-bennett-ph-d": loadTherapist(drNoahBennettPhDMeta, {
    en: drNoahBennettPhDEn as TherapistLocaleSlice,
    ko: drNoahBennettPhDKo as TherapistLocaleSlice,
    jp: drNoahBennettPhDJp as TherapistLocaleSlice,
  }),
  "dr-maya-han": loadTherapist(drMayaHanMeta, {
    en: drMayaHanEn as TherapistLocaleSlice,
    ko: drMayaHanKo as TherapistLocaleSlice,
    jp: drMayaHanJp as TherapistLocaleSlice,
  }),
  "dr-erin-cho-ph-d": loadTherapist(drErinChoPhDMeta, {
    en: drErinChoPhDEn as TherapistLocaleSlice,
    ko: drErinChoPhDKo as TherapistLocaleSlice,
    jp: drErinChoPhDJp as TherapistLocaleSlice,
  }),
};
