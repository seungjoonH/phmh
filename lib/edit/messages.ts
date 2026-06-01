// locale 메시지 트리에 dot-path 값 설정
import {
  formatStepNumber,
  parseStepFieldKey,
  renumberSteps,
  type GettingStartedStep,
} from "@/lib/edit/getting-started-step";
import type { LocaleStringArrays, LocaleTextValues } from "@/lib/edit/client";
import { parseArrayItemKey } from "@/lib/edit/array-item-key";
import { getStringArrayAtPath } from "@/lib/edit/get-message-array";
import { getStepsAtPath } from "@/lib/edit/get-message-steps";
import {
  stripFlowBlockForStorage,
  type FlowBlock,
} from "@/lib/edit/section-flow";
import {
  sectionsPathFromOrderKey,
  type LongFormSectionsDraftEntry,
} from "@/lib/edit/long-form-section";
import type { Messages } from "@/lib/i18n/messages";

export function setStepsAtPath(
  messages: Messages,
  keyPath: string,
  value: GettingStartedStep[],
): Messages {
  const parts = keyPath.split(".");
  const clone = structuredClone(messages) as Record<string, unknown>;
  let current: Record<string, unknown> = clone;
  for (let i = 0; i < parts.length - 1; i++) {
    current = ensureObjectAt(current, parts[i]);
  }
  current[parts[parts.length - 1]] = value;
  return clone as Messages;
}

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

function isArrayIndex(part: string): boolean {
  return /^\d+$/.test(part);
}

function cloneChildForPath(next: unknown, followingPart: string): Record<string, unknown> | unknown[] {
  if (Array.isArray(next)) return [...next];
  if (next !== null && typeof next === "object") {
    return { ...(next as Record<string, unknown>) };
  }
  return isArrayIndex(followingPart) ? [] : {};
}

function ensureObjectAt(
  current: Record<string, unknown>,
  part: string,
): Record<string, unknown> {
  const next = current[part];
  if (next !== null && typeof next === "object" && !Array.isArray(next)) {
    const copy = { ...(next as Record<string, unknown>) };
    current[part] = copy;
    return copy;
  }
  const created: Record<string, unknown> = {};
  current[part] = created;
  return created;
}

export function setAtPath(messages: Messages, keyPath: string, value: string): Messages {
  const parts = keyPath.split(".");
  const clone = structuredClone(messages) as Record<string, unknown>;
  let current: Record<string, unknown> | unknown[] = clone;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    const followingPart = parts[i + 1];
    if (Array.isArray(current)) {
      if (!isArrayIndex(part)) return clone as Messages;
      const index = Number(part);
      const child = cloneChildForPath(current[index], followingPart);
      current[index] = child;
      current = child;
      continue;
    }
    const child = cloneChildForPath(current[part], followingPart);
    current[part] = child;
    current = child;
  }
  const leaf = parts[parts.length - 1];
  if (Array.isArray(current)) {
    if (!isArrayIndex(leaf)) return clone as Messages;
    current[Number(leaf)] = value;
  } else {
    current[leaf] = value;
  }
  return clone as Messages;
}

/** paragraphs.0 등 배열 항목 텍스트 초안 — setAtPath 대신 배열 인덱스로 병합 */
export function applyArrayItemTextDraftsForLocale(
  base: Messages,
  locale: string,
  drafts: Record<string, Partial<LocaleTextValues>>,
  options?: { skipKeys?: (key: string) => boolean },
): Messages {
  let result = base;
  for (const [key, entry] of Object.entries(drafts)) {
    if (options?.skipKeys?.(key)) continue;
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
    if (parseArrayItemKey(key) || parseStepFieldKey(key)) continue;
    const value = entry[locale];
    if (typeof value === "string") {
      result = setAtPath(result, key, value);
    }
  }
  return result;
}

export function applyStepFieldDraftsForLocale(
  base: Messages,
  locale: string,
  drafts: Record<string, Partial<LocaleTextValues>>,
): Messages {
  let result = base;
  const arrayKeys = new Set<string>();
  for (const key of Object.keys(drafts)) {
    const parsed = parseStepFieldKey(key);
    if (parsed) arrayKeys.add(parsed.arrayKey);
  }

  for (const arrayKey of arrayKeys) {
    const steps = getStepsAtPath(result, arrayKey);
    if (!steps) continue;
    const next = steps.map((step, i) => ({
      number: formatStepNumber(i),
      title: drafts[`${arrayKey}.${i}.title`]?.[locale] ?? step.title,
      description:
        drafts[`${arrayKey}.${i}.description`]?.[locale] ?? step.description,
    }));
    result = setStepsAtPath(result, arrayKey, renumberSteps(next));
  }

  return result;
}

export function applyArrayDraftsForLocale(
  base: Messages,
  locale: string,
  arrayDrafts: Record<string, Partial<LocaleStringArrays>>,
  options?: { skipKeys?: (key: string) => boolean },
): Messages {
  let result = base;
  for (const [key, entry] of Object.entries(arrayDrafts)) {
    if (options?.skipKeys?.(key)) continue;
    const value = entry[locale];
    if (Array.isArray(value)) {
      result = setArrayAtPath(result, key, value);
    }
  }
  return result;
}

export function applyStepsDraftsForLocale(
  base: Messages,
  locale: string,
  stepsDrafts: Record<string, Partial<Record<string, GettingStartedStep[]>>>,
): Messages {
  let result = base;
  for (const [key, entry] of Object.entries(stepsDrafts)) {
    const value = entry[locale];
    if (Array.isArray(value)) {
      result = setStepsAtPath(result, key, value);
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

/**
 * flow draft 를 messages 에 반영 — `section.flow` 만 저장하고 `groups`/`lists`/`closing` 은 절대
 * 건드리지 않는다. flow 블록의 textKey 가 가리키는 원본 좌표(`groups.0.1` 등)가 유지되어야
 * 본문 텍스트를 정확히 hydrate 할 수 있다.
 *
 * (이전 버전은 `flowToSectionContent` 로 groups/lists/closing 을 재구성해서 덮어썼는데,
 *  그 결과 mutation 으로 순서가 바뀌면 textKey 가 가리키는 messages 좌표가 다른 텍스트를 지시하게
 *  되어 데이터 손실/뒤바뀜 버그가 발생했다.)
 */
export function applyLongFormSectionDraftsForLocale(
  base: Messages,
  locale: string,
  drafts: Record<string, LongFormSectionsDraftEntry>,
): Messages {
  let result = base;
  for (const [orderKey, draft] of Object.entries(drafts)) {
    if (!draft.removed.length && !Object.keys(draft.added).length) continue;
    const sectionsPath = sectionsPathFromOrderKey(orderKey);
    const parts = sectionsPath.split(".");
    const clone = structuredClone(result) as Record<string, unknown>;
    let current: Record<string, unknown> = clone;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      const next = current[part];
      if (next === null || typeof next !== "object") {
        continue;
      }
      current[part] = { ...(next as Record<string, unknown>) };
      current = current[part] as Record<string, unknown>;
    }
    const leaf = parts[parts.length - 1];
    const prev = (current[leaf] ?? {}) as Record<string, unknown>;
    const nextSections = { ...prev };
    for (const key of draft.removed) {
      delete nextSections[key];
    }
    for (const [slug, byLocale] of Object.entries(draft.added)) {
      const content = byLocale[locale];
      if (content) nextSections[slug] = content;
    }
    current[leaf] = nextSections;
    result = clone as Messages;
  }
  return result;
}

export function applyFlowDraftsForLocale(
  base: Messages,
  flowDrafts: Record<string, FlowBlock[]>,
): Messages {
  let result = base;
  for (const [sectionKey, flow] of Object.entries(flowDrafts)) {
    const storedFlow = flow.map(stripFlowBlockForStorage);
    result = setObjectAtPath(result, sectionKey, { flow: storedFlow });
  }
  return result;
}
