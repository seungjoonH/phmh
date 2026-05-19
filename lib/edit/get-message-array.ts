// messages 트리에서 dot-path 문자열 배열 읽기
import type { Messages } from "@/lib/i18n/messages";

export function getStringArrayAtPath(
  messages: Messages,
  keyPath: string,
): string[] | undefined {
  const parts = keyPath.split(".");
  let current: unknown = messages;
  for (const part of parts) {
    if (current === null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  if (!Array.isArray(current)) return undefined;
  if (!current.every((item) => typeof item === "string")) return undefined;
  return current as string[];
}

/** messages leaf가 배열이 아닐 때(초안 오적용 등) 빈 배열로 폴백 */
export function coerceStringArray(value: unknown): string[] {
  if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
    return value;
  }
  return [];
}
