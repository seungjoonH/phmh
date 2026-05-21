// 삭제된 이미지 키 SSOT — 빌드/런타임 양쪽에서 'hidden' 여부 조회
import data from "@/data/image-hidden.json";

const raw = (data as { hidden?: unknown }).hidden;
const HIDDEN: ReadonlySet<string> = new Set(
  Array.isArray(raw) ? raw.filter((k): k is string => typeof k === "string") : [],
);

export function isImageKeyHidden(key: string): boolean {
  return HIDDEN.has(key);
}
