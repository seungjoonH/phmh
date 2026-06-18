// messages 트리에서 dot-path 목록 트리 읽기
import type { ListTree } from "@/lib/edit/list-tree";
import { normalizeListTree } from "@/lib/edit/list-tree";
import type { Messages } from "@/lib/i18n/messages";

export function getListTreeAtPath(
  messages: Messages,
  keyPath: string,
  defaultMarker: "dash" | "decimal-dot" = "dash",
): ListTree | undefined {
  const parts = keyPath.split(".");
  let current: unknown = messages;
  for (const part of parts) {
    if (current === null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  if (!Array.isArray(current)) return undefined;
  return normalizeListTree(current, defaultMarker);
}
