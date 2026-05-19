// locale 문자열 배열 항목 — dot-path 키 파싱·병합
import type { LocaleStringArrays, LocaleTextValues } from "@/lib/edit/client";
import { getActiveLocaleIds } from "@/lib/site-locales";

export type ArrayItemKey = {
  arrayKey: string;
  index: number;
};

/** Prose·리스트 등 단일 문자열 배열의 leaf 세그먼트 (groups.0.0 같은 중첩 키는 제외) */
const ARRAY_ITEM_LEAF_SEGMENTS = new Set([
  "paragraphs",
  "intro",
  "closing",
  "items",
]);

export function parseArrayItemKey(key: string): ArrayItemKey | null {
  const match = /^(.+)\.(\d+)$/.exec(key);
  if (!match) return null;
  const arrayKey = match[1];
  const leaf = arrayKey.split(".").pop();
  if (!leaf || !ARRAY_ITEM_LEAF_SEGMENTS.has(leaf)) return null;
  const index = Number(match[2]);
  if (!Number.isInteger(index) || index < 0) return null;
  return { arrayKey, index };
}

export function localeTextFromArrayItem(
  arrays: LocaleStringArrays,
  index: number,
): LocaleTextValues {
  return Object.fromEntries(
    getActiveLocaleIds().map((id) => [id, arrays[id]?.[index] ?? ""]),
  ) as LocaleTextValues;
}

export function mergeArrayItemIntoLocales(
  arrays: LocaleStringArrays,
  index: number,
  entry: LocaleTextValues,
): LocaleStringArrays {
  const next: LocaleStringArrays = { ...arrays };
  for (const id of getActiveLocaleIds()) {
    const arr = [...(next[id] ?? [])];
    while (arr.length <= index) arr.push("");
    arr[index] = entry[id] ?? arr[index] ?? "";
    next[id] = arr;
  }
  return next;
}
