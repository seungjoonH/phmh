// 편집 초안 일괄 저장 — edit-server에 순서대로 반영
import { arrayBufferToBase64 } from "@/lib/edit/array-buffer-to-base64";
type ImageDraft = { previewUrl: string; file: File };
import type { ContactFormStructurePayload } from "@/lib/edit/client";
import {
  commitOrphanStepFieldDrafts,
  commitStepsArrayDrafts,
} from "@/lib/edit/commit-steps";
import {
  addContactFormField,
  createLocale,
  fetchArrayRegistry,
  fetchContactFormStructure,
  fetchTherapistsManifest,
  patchContactFormStructure,
  patchCenter,
  patchLocaleManifest,
  patchListTreeArray,
  patchStringArray,
  patchText,
  patchTherapist,
  putSitePagesVisibility,
  removeContactFormField,
  renameTherapist,
  restoreTherapistDefaultPortrait,
  setImageHidden,
  writeImageFile,
  type LocaleListTreeArrays,
  type LocaleStepsArrays,
  type LocaleStringArrays,
  type LocaleTextValues,
} from "@/lib/edit/client";
import type { ContentLocale } from "@/lib/content-blocks/types";
import { getTherapistContentLocaleIds } from "@/lib/therapists/manifest";
import { slugFromDisplayName } from "@/lib/therapists/slug";
import type { TherapistRecord } from "@/lib/therapists/types";
import {
  mergeArrayItemIntoLocales,
  parseArrayItemKey,
} from "@/lib/edit/array-item-key";
import { expandTextDraftsForCommit } from "@/lib/edit/linked-text-keys";
import { emptyLocaleTextValues } from "@/lib/edit/locale-helpers";
import {
  applyCenterFieldLocales,
  applyCenterTitleLocales,
  getCenterLinkedTextKeys,
  isCenterEditKey,
  parseCenterFieldKey,
} from "@/lib/edit/center-edit-key";
import {
  applyTherapistArrayLocales,
  applyTherapistFieldLocales,
  applyTherapistNameLocales,
  getTherapistLinkedTextKeys,
  isTherapistEditKey,
  parseTherapistArrayKey,
  parseTherapistFieldKey,
} from "@/lib/edit/therapist-edit-key";
import { getTherapistBySlug } from "@/lib/therapists/load";
import { getCenterBySlug } from "@/lib/centers/load";
import { setCenterRuntime } from "@/lib/centers/runtime";
import {
  renameTherapistRuntime,
  setTherapistRuntime,
} from "@/lib/therapists/runtime";
import { isFlowManagedContentKey } from "@/lib/edit/flow-group-key";
import { getActiveLocaleIds } from "@/lib/site-locales";
import { getImageRegistryEntry } from "@/lib/edit/image-registry";
import { therapistSlugFromPortraitKey } from "@/lib/therapists/default-portrait";
import type { LocaleManifest } from "@/lib/site-locales";

export type PendingCommitInput = {
  drafts: Record<string, LocaleTextValues>;
  arrayDrafts: Record<string, Partial<LocaleStringArrays>>;
  listTreeDrafts: Record<string, Partial<LocaleListTreeArrays>>;
  stepsDrafts: Record<string, Partial<LocaleStepsArrays>>;
  hiddenTextKeys: Record<string, true>;
  imageDrafts: Record<string, ImageDraft>;
  imageDeleteDrafts: Record<string, true>;
  contactStructureDraft: ContactFormStructurePayload | null;
  contactStructureBaseline: ContactFormStructurePayload | null;
  localeManifestDraft: LocaleManifest | null;
  localeManifestBaseline: LocaleManifest | null;
  pendingLocaleCreates: string[];
  sitePagesHiddenDraft: string[] | null;
  sitePagesHiddenBaseline: string[] | null;
  therapistDirtySlugs?: string[];
  /** flow 저장 직후 — groups 셀은 commit-section-flow에서 이미 반영됨 */
  flowDraftSectionKeys?: string[];
};

async function mergeArrayItemTextDrafts(
  drafts: Record<string, LocaleTextValues>,
  arrayDrafts: Record<string, Partial<LocaleStringArrays>>,
  flowDraftSectionKeys: string[] = [],
): Promise<{
  textDrafts: Record<string, LocaleTextValues>;
  mergedArrayDrafts: Record<string, LocaleStringArrays>;
}> {
  const textDrafts = { ...drafts };
  const mergedArrayDrafts: Record<string, LocaleStringArrays> = {};
  const flowSectionKeys = new Set(flowDraftSectionKeys);

  for (const [key, partial] of Object.entries(arrayDrafts)) {
    if (!partial || Object.keys(partial).length === 0) continue;
    const complete = getActiveLocaleIds().every((id) => Array.isArray(partial[id]));
    if (!complete) continue;
    mergedArrayDrafts[key] = partial as LocaleStringArrays;
  }

  for (const [key, entry] of Object.entries(drafts)) {
    if (isTherapistEditKey(key) || isCenterEditKey(key)) continue;
    const parsed = parseArrayItemKey(key);
    if (!parsed) continue;
    if (isFlowManagedContentKey(key, flowSectionKeys)) {
      delete textDrafts[key];
      continue;
    }
    delete textDrafts[key];

    const current =
      mergedArrayDrafts[parsed.arrayKey] ??
      (await fetchArrayRegistry(parsed.arrayKey).catch(() => null));
    if (!current) continue;

    mergedArrayDrafts[parsed.arrayKey] = mergeArrayItemIntoLocales(
      current,
      parsed.index,
      entry,
    );
  }

  return { textDrafts, mergedArrayDrafts };
}

export async function computeTherapistTargetSlug(
  oldSlug: string,
  record: TherapistRecord,
): Promise<string> {
  const locales = getTherapistContentLocaleIds() as ContentLocale[];
  let name = "";
  for (const id of locales) {
    const v = record.list.name[id]?.trim();
    if (v) {
      name = v;
      break;
    }
  }
  if (!name) return oldSlug;
  let allSlugs: string[];
  try {
    const manifest = (await fetchTherapistsManifest()) as { order?: string[] };
    allSlugs = manifest.order ?? [];
  } catch {
    allSlugs = [oldSlug];
  }
  const others = allSlugs.filter((s) => s !== oldSlug);
  return slugFromDisplayName(name, others);
}

export type PendingCommitResult = {
  renamedSlugs: Record<string, string>;
};

export async function commitPendingEdits(
  input: PendingCommitInput,
): Promise<PendingCommitResult> {
  const flowSectionKeys = new Set(input.flowDraftSectionKeys ?? []);

  const { textDrafts, mergedArrayDrafts } = await mergeArrayItemTextDrafts(
    input.drafts,
    input.arrayDrafts,
    input.flowDraftSectionKeys,
  );

  for (const key of Object.keys(input.hiddenTextKeys)) {
    if (isTherapistEditKey(key) || isCenterEditKey(key)) continue;
    if (isFlowManagedContentKey(key, flowSectionKeys)) continue;
    await patchText(key, emptyLocaleTextValues());
  }

  const therapistSlugs = new Set<string>();
  for (const key of Object.keys(textDrafts)) {
    if (!isTherapistEditKey(key)) continue;
    const ref = parseTherapistFieldKey(key);
    if (ref) therapistSlugs.add(ref.slug);
  }
  for (const slug of input.therapistDirtySlugs ?? []) {
    therapistSlugs.add(slug);
  }

  const renamedSlugs: Record<string, string> = {};

  for (const slug of therapistSlugs) {
    let record = getTherapistBySlug(slug);
    if (!record) continue;
    let nameSynced = false;
    for (const [key, entry] of Object.entries(textDrafts)) {
      const ref = parseTherapistFieldKey(key);
      if (!ref || ref.slug !== slug) continue;
      if (getTherapistLinkedTextKeys(key)) {
        if (!nameSynced) {
          record = applyTherapistNameLocales(record, entry);
          nameSynced = true;
        }
        delete textDrafts[key];
        continue;
      }
      record = applyTherapistFieldLocales(record, ref, entry);
      delete textDrafts[key];
    }

    const targetSlug = await computeTherapistTargetSlug(slug, record);
    if (targetSlug !== slug) {
      const result = await renameTherapist(slug, targetSlug, record);
      renameTherapistRuntime(slug, targetSlug);
      setTherapistRuntime(targetSlug, result.record ?? { ...record, slug: targetSlug });
      renamedSlugs[slug] = targetSlug;
    } else {
      const result = await patchTherapist(slug, record);
      setTherapistRuntime(slug, result.record ?? record);
    }
  }

  const centerSlugs = new Set<string>();
  for (const key of Object.keys(textDrafts)) {
    if (!isCenterEditKey(key)) continue;
    const ref = parseCenterFieldKey(key);
    if (ref) centerSlugs.add(ref.slug);
  }

  for (const slug of centerSlugs) {
    let record = getCenterBySlug(slug);
    if (!record) continue;
    let titleSynced = false;
    for (const [key, entry] of Object.entries(textDrafts)) {
      const ref = parseCenterFieldKey(key);
      if (!ref || ref.slug !== slug) continue;
      if (getCenterLinkedTextKeys(key)) {
        if (!titleSynced) {
          record = applyCenterTitleLocales(record, entry);
          titleSynced = true;
        }
        delete textDrafts[key];
        continue;
      }
      record = applyCenterFieldLocales(record, ref, entry);
      delete textDrafts[key];
    }
    const result = await patchCenter(slug, record);
    setCenterRuntime(slug, result.record ?? record);
  }

  for (const [key, locales] of expandTextDraftsForCommit(textDrafts)) {
    if (isFlowManagedContentKey(key, flowSectionKeys)) continue;
    await patchText(key, locales);
  }

  for (const [key, locales] of Object.entries(mergedArrayDrafts)) {
    const therapistArray = parseTherapistArrayKey(key);
    if (therapistArray) {
      let record = getTherapistBySlug(therapistArray.slug);
      if (!record) continue;
      record = applyTherapistArrayLocales(record, therapistArray, locales);
      const result = await patchTherapist(therapistArray.slug, record);
      setTherapistRuntime(therapistArray.slug, result.record ?? record);
      continue;
    }
    if (isFlowManagedContentKey(key, flowSectionKeys)) continue;
    await patchStringArray(key, locales);
  }

  const mergedListTreeDrafts: Record<string, LocaleListTreeArrays> = {};
  for (const [key, partial] of Object.entries(input.listTreeDrafts ?? {})) {
    if (!partial || Object.keys(partial).length === 0) continue;
    const complete = getActiveLocaleIds().every((id) => Array.isArray(partial[id]));
    if (!complete) continue;
    mergedListTreeDrafts[key] = partial as LocaleListTreeArrays;
  }
  for (const [key, locales] of Object.entries(mergedListTreeDrafts)) {
    await patchListTreeArray(key, locales);
  }

  await commitStepsArrayDrafts(input.stepsDrafts, textDrafts);

  const stepsKeysWithStructureDraft = new Set(Object.keys(input.stepsDrafts));
  for (const key of Object.keys(textDrafts)) {
    const match = /^(.+\.steps)\.\d+\.(title|description)$/.exec(key);
    if (match && !stepsKeysWithStructureDraft.has(match[1])) {
      await commitOrphanStepFieldDrafts(match[1], textDrafts, input.stepsDrafts);
      stepsKeysWithStructureDraft.add(match[1]);
    }
  }

  for (const [key, draft] of Object.entries(input.imageDrafts)) {
    const entry = getImageRegistryEntry(key);
    if (!entry) continue;
    const buffer = await draft.file.arrayBuffer();
    const base64 = arrayBufferToBase64(buffer);
    await writeImageFile(entry.file, base64, draft.file.type);
  }

  for (const key of Object.keys(input.imageDeleteDrafts)) {
    if (input.imageDrafts[key]) continue;
    const slug = therapistSlugFromPortraitKey(key);
    if (slug) {
      await restoreTherapistDefaultPortrait(slug);
      continue;
    }
    await setImageHidden(key, true);
  }

  if (
    input.contactStructureDraft &&
    isContactStructureDirty(input.contactStructureDraft, input.contactStructureBaseline)
  ) {
    const baseline =
      input.contactStructureBaseline ?? (await fetchContactFormStructure());
    const next = input.contactStructureDraft;
    const baselineIds = new Set(baseline.fields.map((f) => f.id));
    const nextIds = new Set(next.fields.map((f) => f.id));

    for (const fieldId of baselineIds) {
      if (!nextIds.has(fieldId)) {
        await removeContactFormField(fieldId, next.layout);
      }
    }

    for (const field of next.fields) {
      if (!baselineIds.has(field.id)) {
        await addContactFormField(field, next.layout);
      }
    }

    await patchContactFormStructure(next);
  }

  for (const id of input.pendingLocaleCreates) {
    try {
      await createLocale(id);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (!message.includes("already exists")) throw err;
    }
  }

  if (input.localeManifestDraft) {
    await patchLocaleManifest(input.localeManifestDraft);
  }

  if (
    isSitePagesHiddenDirty(
      input.sitePagesHiddenDraft,
      input.sitePagesHiddenBaseline,
    )
  ) {
    await putSitePagesVisibility(input.sitePagesHiddenDraft ?? []);
  }

  return { renamedSlugs };
}

export function isLocaleManifestDirty(
  draft: LocaleManifest | null,
  baseline: LocaleManifest | null,
): boolean {
  if (!draft) return false;
  if (!baseline) return true;
  return (
    draft.order.join("\0") !== baseline.order.join("\0") ||
    [...draft.hidden].sort().join("\0") !== [...baseline.hidden].sort().join("\0")
  );
}

export function isContactStructureDirty(
  draft: ContactFormStructurePayload | null,
  baseline: ContactFormStructurePayload | null,
): boolean {
  if (!draft) return false;
  if (!baseline) return true;
  return JSON.stringify(draft) !== JSON.stringify(baseline);
}

export function isSitePagesHiddenDirty(
  draft: string[] | null,
  baseline: string[] | null,
): boolean {
  if (!draft) return false;
  const a = [...draft].sort().join("\0");
  const b = [...(baseline ?? [])].sort().join("\0");
  return a !== b;
}

export function isSitePagesOrderDirty(
  draft: { topOrder: string[] | null; groupOrder: Record<string, string[]> | null },
  baseline: {
    topOrder: string[] | null;
    groupOrder: Record<string, string[]> | null;
  },
): boolean {
  if (draft.topOrder) {
    const a = draft.topOrder.join("\0");
    const b = (baseline.topOrder ?? []).join("\0");
    if (a !== b) return true;
  }
  if (draft.groupOrder) {
    const baseGroups = baseline.groupOrder ?? {};
    const keys = new Set([
      ...Object.keys(draft.groupOrder),
      ...Object.keys(baseGroups),
    ]);
    for (const key of keys) {
      const a = (draft.groupOrder[key] ?? []).join("\0");
      const b = (baseGroups[key] ?? []).join("\0");
      if (a !== b) return true;
    }
  }
  return false;
}

export function isTherapistOrderDirty(
  draft: string[] | null,
  baseline: string[] | null,
): boolean {
  if (!draft) return false;
  return draft.join("\0") !== (baseline ?? []).join("\0");
}
