// 편집 모드 — manifest 기준 locale 레코드 헬퍼
import type {
  LocaleListTreeArrays,
  LocaleStepsArrays,
  LocaleStringArrays,
  LocaleTextValues,
} from "@/lib/edit/client";
import { getActiveLocaleIds } from "@/lib/site-locales";

const KNOWN_ARRAY_ITEM: Record<string, string> = {
  en: "New paragraph",
  ko: "새 문단",
  jp: "新しい段落",
};

export function emptyLocaleTextValues(): LocaleTextValues {
  return Object.fromEntries(getActiveLocaleIds().map((id) => [id, ""]));
}

export function newArrayItemValues(): LocaleTextValues {
  return Object.fromEntries(
    getActiveLocaleIds().map((id) => [id, KNOWN_ARRAY_ITEM[id] ?? ""]),
  );
}

export function isCompleteLocaleRecord(
  record: Partial<LocaleTextValues> | undefined,
  ids: string[] = getActiveLocaleIds(),
): record is LocaleTextValues {
  if (!record) return false;
  return ids.every((id) => typeof record[id] === "string");
}

export function isCompleteArrayRecord(
  record: Partial<LocaleStringArrays> | undefined,
  ids: string[] = getActiveLocaleIds(),
): record is LocaleStringArrays {
  if (!record) return false;
  return ids.every((id) => Array.isArray(record[id]));
}

export function isCompleteListTreeRecord(
  record: Partial<LocaleListTreeArrays> | undefined,
  ids: string[] = getActiveLocaleIds(),
): record is LocaleListTreeArrays {
  if (!record) return false;
  return ids.every((id) => Array.isArray(record[id]));
}

export function isCompleteStepsRecord(
  record: Partial<LocaleStepsArrays> | undefined,
  ids: string[] = getActiveLocaleIds(),
): record is LocaleStepsArrays {
  if (!record) return false;
  return ids.every((id) => Array.isArray(record[id]));
}
