// Getting Started 스텝 카드 — locale 객체 배열 타입·헬퍼
import type { LocaleTextValues } from "@/lib/edit/client";
import { getActiveLocaleIds } from "@/lib/site-locales";

export type GettingStartedStep = {
  number: string;
  title: string;
  description: string;
};

export type LocaleStepsArrays = Record<string, GettingStartedStep[]>;

export function formatStepNumber(index: number): string {
  return String(index + 1).padStart(2, "0");
}

export function renumberSteps(steps: GettingStartedStep[]): GettingStartedStep[] {
  return steps.map((step, i) => ({
    ...step,
    number: formatStepNumber(i),
  }));
}

export function defaultNewStep(index: number): GettingStartedStep {
  return {
    number: formatStepNumber(index),
    title: "",
    description: "",
  };
}

export function isGettingStartedStep(value: unknown): value is GettingStartedStep {
  if (!value || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  return (
    typeof o.number === "string" &&
    typeof o.title === "string" &&
    typeof o.description === "string"
  );
}

export function parseStepFieldKey(
  key: string,
): { arrayKey: string; index: number; field: "title" | "description" } | null {
  const match = /^(.+)\.(\d+)\.(title|description)$/.exec(key);
  if (!match) return null;
  const index = Number(match[2]);
  if (Number.isNaN(index)) return null;
  return {
    arrayKey: match[1],
    index,
    field: match[3] as "title" | "description",
  };
}

export function localeTextFromStepField(
  locales: LocaleStepsArrays,
  index: number,
  field: "title" | "description",
): LocaleTextValues {
  const result: LocaleTextValues = {};
  for (const [localeId, steps] of Object.entries(locales)) {
    result[localeId] = steps[index]?.[field] ?? "";
  }
  return result;
}

export function mergeStepFieldIntoLocales(
  locales: LocaleStepsArrays,
  index: number,
  field: "title" | "description",
  values: LocaleTextValues,
): LocaleStepsArrays {
  const next: LocaleStepsArrays = { ...locales };
  for (const id of getActiveLocaleIds()) {
    const steps = [...(next[id] ?? [])];
    while (steps.length <= index) {
      steps.push(defaultNewStep(steps.length));
    }
    steps[index] = {
      ...steps[index],
      [field]: values[id] ?? steps[index][field],
    };
    next[id] = renumberSteps(steps);
  }
  return next;
}

export function coerceStepsArray(value: unknown): GettingStartedStep[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isGettingStartedStep);
}

const STEP_FIELD_SUFFIX = /^(\d+)\.(title|description)$/;

type StepFieldBucket = {
  title?: LocaleTextValues;
  description?: LocaleTextValues;
};

function collectStepFieldDrafts(
  drafts: Record<string, LocaleTextValues>,
  arrayKey: string,
): { copy: Record<string, LocaleTextValues>; byIndex: Map<number, StepFieldBucket> } {
  const prefix = `${arrayKey}.`;
  const copy = { ...drafts };
  const byIndex = new Map<number, StepFieldBucket>();

  for (const key of Object.keys(copy)) {
    if (!key.startsWith(prefix)) continue;
    const match = STEP_FIELD_SUFFIX.exec(key.slice(prefix.length));
    if (!match) continue;
    const idx = Number(match[1]);
    const field = match[2] as "title" | "description";
    const bucket = byIndex.get(idx) ?? {};
    bucket[field] = copy[key];
    byIndex.set(idx, bucket);
    delete copy[key];
  }

  return { copy, byIndex };
}

function writeStepFieldDrafts(
  copy: Record<string, LocaleTextValues>,
  arrayKey: string,
  byIndex: Map<number, StepFieldBucket>,
) {
  for (const [idx, bucket] of byIndex.entries()) {
    if (bucket.title) copy[`${arrayKey}.${idx}.title`] = bucket.title;
    if (bucket.description) copy[`${arrayKey}.${idx}.description`] = bucket.description;
  }
}

export function remapStepFieldDraftsAfterMove(
  drafts: Record<string, LocaleTextValues>,
  arrayKey: string,
  from: number,
  to: number,
): Record<string, LocaleTextValues> {
  const { copy, byIndex } = collectStepFieldDrafts(drafts, arrayKey);
  if (byIndex.size === 0) return copy;

  const maxIdx = Math.max(...byIndex.keys(), from, to);
  const ordered: (StepFieldBucket | undefined)[] = [];
  for (let i = 0; i <= maxIdx; i++) ordered[i] = byIndex.get(i);
  const [moved] = ordered.splice(from, 1);
  ordered.splice(to, 0, moved);

  const nextMap = new Map<number, StepFieldBucket>();
  ordered.forEach((bucket, i) => {
    if (bucket) nextMap.set(i, bucket);
  });
  writeStepFieldDrafts(copy, arrayKey, nextMap);
  return copy;
}

export function shiftStepFieldDraftsOnInsert(
  drafts: Record<string, LocaleTextValues>,
  arrayKey: string,
  insertIndex: number,
): Record<string, LocaleTextValues> {
  const { copy, byIndex } = collectStepFieldDrafts(drafts, arrayKey);
  if (byIndex.size === 0) return copy;

  const maxIdx = Math.max(...byIndex.keys(), insertIndex - 1);
  const nextMap = new Map<number, StepFieldBucket>();
  for (let i = 0; i <= maxIdx + 1; i++) {
    if (i < insertIndex) {
      const bucket = byIndex.get(i);
      if (bucket) nextMap.set(i, bucket);
    } else if (i > insertIndex) {
      const bucket = byIndex.get(i - 1);
      if (bucket) nextMap.set(i, bucket);
    }
  }
  writeStepFieldDrafts(copy, arrayKey, nextMap);
  return copy;
}

export function removeStepFieldDrafts(
  drafts: Record<string, LocaleTextValues>,
  arrayKey: string,
  removedIndex: number,
): Record<string, LocaleTextValues> {
  const { copy, byIndex } = collectStepFieldDrafts(drafts, arrayKey);
  if (byIndex.size === 0) return copy;

  const nextMap = new Map<number, StepFieldBucket>();
  for (const [idx, bucket] of byIndex.entries()) {
    if (idx === removedIndex) continue;
    const target = idx > removedIndex ? idx - 1 : idx;
    nextMap.set(target, bucket);
  }
  writeStepFieldDrafts(copy, arrayKey, nextMap);
  return copy;
}
