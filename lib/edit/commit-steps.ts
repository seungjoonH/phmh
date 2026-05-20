// Getting Started steps 배열 — locale 파일에 저장
import {
  fetchStepsRegistry,
  patchStepsArray,
  type LocaleStepsArrays,
  type LocaleTextValues,
} from "@/lib/edit/client";
import { formatStepNumber, renumberSteps } from "@/lib/edit/getting-started-step";
import { getActiveLocaleIds } from "@/lib/site-locales";

function mergeStepsWithTextDrafts(
  arrayKey: string,
  stepsByLocale: LocaleStepsArrays,
  drafts: Record<string, LocaleTextValues>,
): LocaleStepsArrays {
  const merged: LocaleStepsArrays = {};

  for (const localeId of getActiveLocaleIds()) {
    const steps = [...(stepsByLocale[localeId] ?? [])];
    const next = steps.map((step, i) => ({
      number: formatStepNumber(i),
      title: drafts[`${arrayKey}.${i}.title`]?.[localeId] ?? step.title,
      description:
        drafts[`${arrayKey}.${i}.description`]?.[localeId] ?? step.description,
    }));
    merged[localeId] = renumberSteps(next);
  }

  return merged;
}

export async function commitStepsArrayDrafts(
  stepsDrafts: Record<string, Partial<LocaleStepsArrays>>,
  drafts: Record<string, LocaleTextValues>,
): Promise<void> {
  for (const [arrayKey, partial] of Object.entries(stepsDrafts)) {
    if (!partial || Object.keys(partial).length === 0) continue;

    const complete = getActiveLocaleIds().every((id) => Array.isArray(partial[id]));
    if (!complete) continue;

    const merged = mergeStepsWithTextDrafts(
      arrayKey,
      partial as LocaleStepsArrays,
      drafts,
    );
    await patchStepsArray(arrayKey, merged);
  }
}

export async function commitOrphanStepFieldDrafts(
  arrayKey: string,
  drafts: Record<string, LocaleTextValues>,
  stepsDrafts: Record<string, Partial<LocaleStepsArrays>>,
): Promise<void> {
  if (stepsDrafts[arrayKey]) return;

  const hasStepFieldDraft = Object.keys(drafts).some((k) =>
    k.startsWith(`${arrayKey}.`),
  );
  if (!hasStepFieldDraft) return;

  const fromDisk = await fetchStepsRegistry(arrayKey);
  const merged = mergeStepsWithTextDrafts(arrayKey, fromDisk, drafts);
  await patchStepsArray(arrayKey, merged);
}
