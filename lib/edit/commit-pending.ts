// 편집 초안 일괄 저장 — edit-server에 순서대로 반영
import { arrayBufferToBase64 } from "@/lib/edit/array-buffer-to-base64";
type ImageDraft = { previewUrl: string; file: File };
import type { ContactFormStructurePayload } from "@/lib/edit/client";
import {
  addContactFormField,
  createLocale,
  fetchArrayRegistry,
  fetchContactFormStructure,
  patchContactFormStructure,
  patchLocaleManifest,
  patchStringArray,
  patchText,
  removeContactFormField,
  writeImageFile,
  type LocaleStringArrays,
  type LocaleTextValues,
} from "@/lib/edit/client";
import {
  mergeArrayItemIntoLocales,
  parseArrayItemKey,
} from "@/lib/edit/array-item-key";
import { expandTextDraftsForCommit } from "@/lib/edit/linked-text-keys";
import { emptyLocaleTextValues } from "@/lib/edit/locale-helpers";
import { getActiveLocaleIds } from "@/lib/site-locales";
import { getImageRegistryEntry } from "@/lib/edit/image-registry";
import type { LocaleManifest } from "@/lib/site-locales";

export type PendingCommitInput = {
  drafts: Record<string, LocaleTextValues>;
  arrayDrafts: Record<string, Partial<LocaleStringArrays>>;
  hiddenTextKeys: Record<string, true>;
  imageDrafts: Record<string, ImageDraft>;
  contactStructureDraft: ContactFormStructurePayload | null;
  contactStructureBaseline: ContactFormStructurePayload | null;
  localeManifestDraft: LocaleManifest | null;
  localeManifestBaseline: LocaleManifest | null;
  pendingLocaleCreates: string[];
};

async function mergeArrayItemTextDrafts(
  drafts: Record<string, LocaleTextValues>,
  arrayDrafts: Record<string, Partial<LocaleStringArrays>>,
): Promise<{
  textDrafts: Record<string, LocaleTextValues>;
  mergedArrayDrafts: Record<string, LocaleStringArrays>;
}> {
  const textDrafts = { ...drafts };
  const mergedArrayDrafts: Record<string, LocaleStringArrays> = {};

  for (const [key, partial] of Object.entries(arrayDrafts)) {
    if (!partial || Object.keys(partial).length === 0) continue;
    const complete = getActiveLocaleIds().every((id) => Array.isArray(partial[id]));
    if (!complete) continue;
    mergedArrayDrafts[key] = partial as LocaleStringArrays;
  }

  for (const [key, entry] of Object.entries(drafts)) {
    const parsed = parseArrayItemKey(key);
    if (!parsed) continue;
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

export async function commitPendingEdits(input: PendingCommitInput): Promise<void> {
  const { textDrafts, mergedArrayDrafts } = await mergeArrayItemTextDrafts(
    input.drafts,
    input.arrayDrafts,
  );

  for (const key of Object.keys(input.hiddenTextKeys)) {
    await patchText(key, emptyLocaleTextValues());
  }

  for (const [key, locales] of expandTextDraftsForCommit(textDrafts)) {
    await patchText(key, locales);
  }

  for (const [key, locales] of Object.entries(mergedArrayDrafts)) {
    await patchStringArray(key, locales);
  }

  for (const [key, draft] of Object.entries(input.imageDrafts)) {
    const entry = getImageRegistryEntry(key);
    if (!entry) continue;
    const buffer = await draft.file.arrayBuffer();
    const base64 = arrayBufferToBase64(buffer);
    await writeImageFile(entry.file, base64, draft.file.type);
  }

  if (input.contactStructureDraft) {
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
