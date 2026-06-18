// 편집 초안 — data-phmh-key 기준 미저장 여부 (표시값 vs 디스크 커밋 비교)
import type { LocaleTextValues } from "@/lib/edit/client";
import { parseArrayItemKey } from "@/lib/edit/array-item-key";
import { getStringArrayAtPath } from "@/lib/edit/get-message-array";
import { getStepsAtPath } from "@/lib/edit/get-message-steps";
import { parseStepFieldKey } from "@/lib/edit/getting-started-step";
import { getLinkedTextKeyGroupId } from "@/lib/edit/linked-text-keys";
import { findLinkedDraft } from "@/lib/edit/linked-text-keys";
import {
  isTherapistArrayKey,
  isTherapistEditKey,
} from "@/lib/edit/therapist-edit-key";
import { isCenterEditKey, parseCenterImagesKey } from "@/lib/edit/center-edit-key";
import type { FlowBlock } from "@/lib/edit/section-flow";
import { tPath, type Messages } from "@/lib/i18n/messages";

export type PendingCheckContext = {
  locale: string;
  committedMessages: Messages;
  displayMessages: Messages;
  drafts: Record<string, LocaleTextValues>;
  imageDrafts: Record<string, unknown>;
  centerImageDrafts?: Record<string, unknown>;
  imageDeleteDrafts?: Record<string, true>;
  hiddenTextKeys: Record<string, true>;
  arrayDrafts?: Record<string, unknown>;
  listTreeDrafts?: Record<string, unknown>;
  stepsDrafts?: Record<string, unknown>;
  flowDrafts?: Record<string, FlowBlock[]>;
};

export function getTextValueAtPath(messages: Messages, key: string): string {
  const stepField = parseStepFieldKey(key);
  if (stepField) {
    return (
      getStepsAtPath(messages, stepField.arrayKey)?.[stepField.index]?.[stepField.field] ??
      ""
    );
  }
  const arrayItem = parseArrayItemKey(key);
  if (arrayItem) {
    return getStringArrayAtPath(messages, arrayItem.arrayKey)?.[arrayItem.index] ?? "";
  }
  return tPath(messages, key);
}

function textValueDiffers(
  committedMessages: Messages,
  displayMessages: Messages,
  key: string,
): boolean {
  return (
    getTextValueAtPath(committedMessages, key) !==
    getTextValueAtPath(displayMessages, key)
  );
}

function stepsArrayDiffers(
  committedMessages: Messages,
  displayMessages: Messages,
  arrayKey: string,
): boolean {
  const a = getStepsAtPath(committedMessages, arrayKey);
  const b = getStepsAtPath(displayMessages, arrayKey);
  return JSON.stringify(a ?? []) !== JSON.stringify(b ?? []);
}

function stringArrayDiffers(
  committedMessages: Messages,
  displayMessages: Messages,
  arrayKey: string,
): boolean {
  const a = getStringArrayAtPath(committedMessages, arrayKey);
  const b = getStringArrayAtPath(displayMessages, arrayKey);
  return JSON.stringify(a ?? []) !== JSON.stringify(b ?? []);
}

function flowSectionDiffers(
  committedMessages: Messages,
  displayMessages: Messages,
  sectionKey: string,
): boolean {
  const parts = sectionKey.split(".");
  let committed: unknown = committedMessages;
  let display: unknown = displayMessages;
  for (const part of parts) {
    if (committed === null || typeof committed !== "object") committed = undefined;
    else committed = (committed as Record<string, unknown>)[part];
    if (display === null || typeof display !== "object") display = undefined;
    else display = (display as Record<string, unknown>)[part];
  }
  return JSON.stringify(committed ?? {}) !== JSON.stringify(display ?? {});
}

export function isEditKeyPending(key: string, ctx: PendingCheckContext): boolean {
  if (ctx.hiddenTextKeys[key] || ctx.imageDrafts[key] || ctx.imageDeleteDrafts?.[key]) {
    return true;
  }

  const centerImageSlug = parseCenterImagesKey(key);
  if (centerImageSlug && ctx.centerImageDrafts?.[centerImageSlug]) {
    return true;
  }

  if (
    (isTherapistEditKey(key) || isCenterEditKey(key)) &&
    findLinkedDraft(ctx.drafts, key)
  ) {
    return true;
  }

  if (isTherapistArrayKey(key) && ctx.arrayDrafts?.[key]) {
    return true;
  }

  if (key.endsWith(".items") && ctx.listTreeDrafts?.[key]) {
    return true;
  }

  return textValueDiffers(ctx.committedMessages, ctx.displayMessages, key);
}

function collectFlowTextKeys(flow: FlowBlock[]): string[] {
  const keys: string[] = [];
  for (const block of flow) {
    if (
      block.type === "p" ||
      block.type === "heading" ||
      block.type === "sectionTitle" ||
      block.type === "button"
    ) {
      keys.push(block.textKey);
    }
    if (block.type === "list") {
      keys.push(`${block.listKey}.items`);
    }
    if (block.type === "img") {
      keys.push(block.editKey);
    }
  }
  return keys;
}

export function countDirtyTextKeyGroups(ctx: PendingCheckContext): number {
  const groups = new Set<string>();
  const seen = new Set<string>();

  const markIfDirty = (key: string) => {
    if (seen.has(key)) return;
    seen.add(key);
    if (isEditKeyPending(key, ctx)) {
      groups.add(getLinkedTextKeyGroupId(key));
    }
  };

  for (const key of Object.keys(ctx.drafts)) {
    markIfDirty(key);
  }

  for (const arrayKey of Object.keys(ctx.stepsDrafts ?? {})) {
    const steps = getStepsAtPath(ctx.displayMessages, arrayKey);
    steps?.forEach((_, i) => {
      markIfDirty(`${arrayKey}.${i}.title`);
      markIfDirty(`${arrayKey}.${i}.description`);
    });
  }

  for (const arrayKey of Object.keys(ctx.arrayDrafts ?? {})) {
    if (isTherapistArrayKey(arrayKey)) {
      markIfDirty(arrayKey);
      continue;
    }
    const arr = getStringArrayAtPath(ctx.displayMessages, arrayKey);
    arr?.forEach((_, i) => markIfDirty(`${arrayKey}.${i}`));
  }

  for (const flow of Object.values(ctx.flowDrafts ?? {})) {
    for (const key of collectFlowTextKeys(flow)) {
      markIfDirty(key);
    }
  }

  return groups.size;
}

/** 텍스트 필드 diff에 안 잡히는 순서·구조 변경만 집계 */
export function countStructuralDrafts(ctx: PendingCheckContext): number {
  let count = 0;

  for (const arrayKey of Object.keys(ctx.stepsDrafts ?? {})) {
    if (!stepsArrayDiffers(ctx.committedMessages, ctx.displayMessages, arrayKey)) {
      continue;
    }
    const anyFieldDirty = Object.keys(ctx.drafts).some(
      (k) => k.startsWith(`${arrayKey}.`) && isEditKeyPending(k, ctx),
    );
    if (!anyFieldDirty) count++;
  }

  for (const arrayKey of Object.keys(ctx.arrayDrafts ?? {})) {
    if (isTherapistArrayKey(arrayKey)) {
      count++;
      continue;
    }
    if (!stringArrayDiffers(ctx.committedMessages, ctx.displayMessages, arrayKey)) {
      continue;
    }
    const anyItemDirty = Object.keys(ctx.drafts).some((k) => {
      const parsed = parseArrayItemKey(k);
      return parsed?.arrayKey === arrayKey && isEditKeyPending(k, ctx);
    });
    if (!anyItemDirty) count++;
  }

  for (const _arrayKey of Object.keys(ctx.listTreeDrafts ?? {})) {
    count++;
  }

  for (const sectionKey of Object.keys(ctx.flowDrafts ?? {})) {
    if (!flowSectionDiffers(ctx.committedMessages, ctx.displayMessages, sectionKey)) {
      continue;
    }
    const flow = ctx.flowDrafts![sectionKey]!;
    const anyTextDirty = collectFlowTextKeys(flow).some((k) => isEditKeyPending(k, ctx));
    if (!anyTextDirty) count++;
  }

  return count;
}

export function countPendingChanges(ctx: PendingCheckContext): number {
  return (
    countDirtyTextKeyGroups(ctx) +
    countStructuralDrafts(ctx) +
    Object.keys(ctx.hiddenTextKeys).length +
    Object.keys(ctx.imageDrafts).length +
    Object.keys(ctx.imageDeleteDrafts ?? {}).length
  );
}
