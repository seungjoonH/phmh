// locale 메시지 트리에 dot-path 값 설정
import type { LocaleStringArrays, LocaleTextValues } from "@/lib/edit/client";
import { parseArrayItemKey } from "@/lib/edit/array-item-key";
import { getStringArrayAtPath } from "@/lib/edit/get-message-array";
import {
  flowToSectionContent,
  type FlowBlock,
} from "@/lib/edit/section-flow";
import type { Messages } from "@/lib/i18n/messages";

export function setArrayAtPath(
  messages: Messages,
  keyPath: string,
  value: string[],
): Messages {
  const parts = keyPath.split(".");
  const clone = structuredClone(messages) as Record<string, unknown>;
  let current: Record<string, unknown> = clone;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    const next = current[part];
    if (next === null || typeof next !== "object") {
      return messages;
    }
    current[part] = { ...(next as Record<string, unknown>) };
    current = current[part] as Record<string, unknown>;
  }
  current[parts[parts.length - 1]] = value;
  return clone as Messages;
}

export function setAtPath(messages: Messages, keyPath: string, value: string): Messages {
  const parts = keyPath.split(".");
  const clone = structuredClone(messages) as Record<string, unknown>;
  let current: Record<string, unknown> = clone;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    const next = current[part];
    if (next === null || typeof next !== "object") {
      return messages;
    }
    current[part] = { ...(next as Record<string, unknown>) };
    current = current[part] as Record<string, unknown>;
  }
  current[parts[parts.length - 1]] = value;
  return clone as Messages;
}

/** paragraphs.0 등 배열 항목 텍스트 초안 — setAtPath 대신 배열 인덱스로 병합 */
export function applyArrayItemTextDraftsForLocale(
  base: Messages,
  locale: string,
  drafts: Record<string, Partial<LocaleTextValues>>,
): Messages {
  let result = base;
  for (const [key, entry] of Object.entries(drafts)) {
    const parsed = parseArrayItemKey(key);
    if (!parsed) continue;
    const value = entry[locale];
    if (typeof value !== "string") continue;

    const arr = [...(getStringArrayAtPath(result, parsed.arrayKey) ?? [])];
    while (arr.length <= parsed.index) arr.push("");
    arr[parsed.index] = value;
    result = setArrayAtPath(result, parsed.arrayKey, arr);
  }
  return result;
}

export function applyDraftsForLocale(
  base: Messages,
  locale: string,
  drafts: Record<string, Partial<LocaleTextValues>>,
): Messages {
  let result = base;
  for (const [key, entry] of Object.entries(drafts)) {
    if (parseArrayItemKey(key)) continue;
    const value = entry[locale];
    if (typeof value === "string") {
      result = setAtPath(result, key, value);
    }
  }
  return result;
}

export function applyArrayDraftsForLocale(
  base: Messages,
  locale: string,
  arrayDrafts: Record<string, Partial<LocaleStringArrays>>,
): Messages {
  let result = base;
  for (const [key, entry] of Object.entries(arrayDrafts)) {
    const value = entry[locale];
    if (Array.isArray(value)) {
      result = setArrayAtPath(result, key, value);
    }
  }
  return result;
}

export function setObjectAtPath(
  messages: Messages,
  keyPath: string,
  value: Record<string, unknown>,
): Messages {
  const parts = keyPath.split(".");
  const clone = structuredClone(messages) as Record<string, unknown>;
  let current: Record<string, unknown> = clone;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    const next = current[part];
    if (next === null || typeof next !== "object") {
      return messages;
    }
    current[part] = { ...(next as Record<string, unknown>) };
    current = current[part] as Record<string, unknown>;
  }
  const leaf = parts[parts.length - 1];
  const prev = current[leaf];
  current[leaf] =
    prev !== null && typeof prev === "object"
      ? { ...(prev as Record<string, unknown>), ...value }
      : value;
  return clone as Messages;
}

export function applyFlowDraftsForLocale(
  base: Messages,
  flowDrafts: Record<string, FlowBlock[]>,
): Messages {
  let result = base;
  for (const [sectionKey, flow] of Object.entries(flowDrafts)) {
    const section = flowToSectionContent(flow);
    result = setObjectAtPath(result, sectionKey, section as Record<string, unknown>);
  }
  return result;
}
