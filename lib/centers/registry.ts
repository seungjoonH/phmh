// manifest 순서에 맞춘 Center 모듈 정적 import (빌드 번들용)
import koreaCenterMeta from "@/data/centers/korea-center/meta.js";
import koreaCenterEn from "@/data/centers/korea-center/en.js";
import koreaCenterKo from "@/data/centers/korea-center/ko.js";
import koreaCenterJp from "@/data/centers/korea-center/jp.js";
import philippinesCenterMeta from "@/data/centers/philippines-center/meta.js";
import philippinesCenterEn from "@/data/centers/philippines-center/en.js";
import philippinesCenterKo from "@/data/centers/philippines-center/ko.js";
import philippinesCenterJp from "@/data/centers/philippines-center/jp.js";
import { mergeCenterRecord } from "@/lib/centers/merge-record";
import type { CenterLocaleSlice, CenterMeta } from "@/lib/centers/merge-record";
import type { CenterRecord } from "@/lib/centers/types";

function loadCenter(
  meta: CenterMeta,
  locales: Record<string, CenterLocaleSlice>,
): CenterRecord {
  return mergeCenterRecord(meta, locales);
}

/** edit-server가 Center 추가·삭제·이름변경 시 이 파일을 자동 재생성한다. 수동 편집 금지. */
export const centerRecordsBySlug: Record<string, CenterRecord> = {
  "korea-center": loadCenter(koreaCenterMeta, {
    en: koreaCenterEn as CenterLocaleSlice,
    ko: koreaCenterKo as CenterLocaleSlice,
    jp: koreaCenterJp as CenterLocaleSlice,
  }),
  "philippines-center": loadCenter(philippinesCenterMeta, {
    en: philippinesCenterEn as CenterLocaleSlice,
    ko: philippinesCenterKo as CenterLocaleSlice,
    jp: philippinesCenterJp as CenterLocaleSlice,
  }),
};
