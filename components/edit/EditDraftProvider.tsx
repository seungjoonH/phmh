"use client";

// 편집 초안 상태 — 화면은 미리보기, 디스크 반영은 툴바「저장」
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { LocaleContext, useLocale } from "@/components/i18n/LocaleProvider";
import { tPath } from "@/lib/i18n/messages";
import { newArrayItemValues } from "@/lib/edit/array-placeholders";
import { commitSectionFlowDrafts } from "@/lib/edit/commit-section-flow";
import {
  commitPendingEdits,
  isContactStructureDirty,
  isLocaleManifestDirty,
} from "@/lib/edit/commit-pending";
import {
  emptyLocaleTextValues,
  isCompleteArrayRecord,
} from "@/lib/edit/locale-helpers";
import {
  localeTextFromArrayItem,
  mergeArrayItemIntoLocales,
  parseArrayItemKey,
} from "@/lib/edit/array-item-key";
import {
  applyArrayDraftsForLocale,
  applyArrayItemTextDraftsForLocale,
  applyDraftsForLocale,
  applyFlowDraftsForLocale,
} from "@/lib/edit/messages";
import {
  arrayDraftForNewFlowBlock,
  createFlowBlock,
  draftEntryForNewFlowBlock,
  type CreateFlowBlockOptions,
} from "@/lib/edit/flow-block-factory";
import {
  flattenSectionToFlow,
  flowToSectionContent,
  hydrateFlowBlocks,
  type FlowBlock,
  type FlowBlockInsertType,
  type SectionContent,
} from "@/lib/edit/section-flow";
import {
  createLocale,
  fetchArrayRegistry,
  fetchContactFormStructure,
  fetchLocaleManifest,
  fetchTextRegistry,
  patchStringArray,
  patchText,
  writeImageFile,
  type ContactFormStructurePayload,
  type LocaleStringArrays,
  type LocaleTextValues,
} from "@/lib/edit/client";
import { ensureLocaleLoaded } from "@/lib/i18n/load-locale";
import { arrayBufferToBase64 } from "@/lib/edit/array-buffer-to-base64";
import { getImageRegistryEntry } from "@/lib/edit/image-registry";
import {
  findLinkedDraft,
  getLinkedTextKeyGroupId,
  getLinkedTextKeys,
} from "@/lib/edit/linked-text-keys";
import { isEditKeyPending as checkEditKeyPending } from "@/lib/edit/pending-keys";
import {
  clearRuntimeContactFormStructure,
  getContactFormStructure,
  setRuntimeContactFormStructure,
} from "@/lib/contact-form-structure";
import {
  clearRuntimeLocaleManifest,
  getActiveLocaleIds,
  getLocaleManifest,
  setRuntimeLocaleManifest,
  type LocaleManifest,
} from "@/lib/site-locales";

export type DraftEntry = LocaleTextValues;

export type ImageDraft = {
  previewUrl: string;
  file: File;
};

type SelectedTarget =
  | { key: string; kind: "text" | "image" }
  | { kind: "contactField"; fieldId: string };

type EditDraftContextValue = {
  drafts: Record<string, DraftEntry>;
  imageDrafts: Record<string, ImageDraft>;
  pendingCount: number;
  committing: boolean;
  selected: SelectedTarget | null;
  openTextEditor: (key: string) => void;
  openImageEditor: (key: string) => void;
  openContactFieldEditor: (fieldId: string) => void;
  closeEditor: () => void;
  setDraftEntry: (key: string, entry: DraftEntry) => void;
  setImageDraft: (key: string, draft: ImageDraft | null) => void;
  revertDraft: (key: string) => void;
  revertImageDraft: (key: string) => void;
  revertAll: () => void;
  commitAll: () => Promise<void>;
  commitTextKey: (key: string) => Promise<void>;
  resolveTextRegistryValues: (key: string) => Promise<LocaleTextValues>;
  commitImageKey: (key: string) => Promise<void>;
  isEditKeyPending: (key: string) => boolean;
  panelBaseline: DraftEntry | null;
  setPanelBaseline: (entry: DraftEntry | null) => void;
  getImagePreviewSrc: (key: string, committedSrc: string) => string;
  arrayBusy: string | null;
  isTextKeyHidden: (key: string) => boolean;
  addArrayItem: (arrayKey: string) => Promise<void>;
  removeArrayItem: (arrayKey: string, index: number) => Promise<void>;
  moveArrayItem: (arrayKey: string, from: number, to: number) => Promise<void>;
  flowBusy: string | null;
  resolveFlowBlocks: (sectionKey: string, section: SectionContent) => FlowBlock[];
  moveFlowBlock: (sectionKey: string, from: number, to: number) => Promise<void>;
  removeFlowBlock: (sectionKey: string, index: number) => Promise<void>;
  insertFlowBlock: (
    sectionKey: string,
    index: number,
    type: FlowBlockInsertType,
    options?: CreateFlowBlockOptions,
  ) => Promise<void>;
  hideTextKey: (key: string) => Promise<void>;
  contactStructureDraft: ContactFormStructurePayload | null;
  setContactStructureDraft: (structure: ContactFormStructurePayload) => void;
  localeManifestDraft: LocaleManifest | null;
  applyLocaleManifestDraft: (manifest: LocaleManifest) => void;
  createLocaleWithFiles: (id: string) => Promise<void>;
  localeCreateBusy: boolean;
  applyArrayDraft: (arrayKey: string, locales: LocaleStringArrays) => void;
};

const EditDraftContext = createContext<EditDraftContextValue | null>(null);

export function useEditDraft() {
  const ctx = useContext(EditDraftContext);
  if (!ctx) throw new Error("useEditDraft must be used within EditDraftProvider");
  return ctx;
}

export function useEditDraftOptional() {
  return useContext(EditDraftContext);
}

function revokeImageDraft(draft: ImageDraft | undefined) {
  if (draft?.previewUrl.startsWith("blob:")) {
    URL.revokeObjectURL(draft.previewUrl);
  }
}

export function EditDraftProvider({ children }: { children: ReactNode }) {
  const base = useLocale();
  const [drafts, setDrafts] = useState<Record<string, DraftEntry>>({});
  const [imageDrafts, setImageDrafts] = useState<Record<string, ImageDraft>>({});
  const [imageCacheBust, setImageCacheBust] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<SelectedTarget | null>(null);
  const [panelBaseline, setPanelBaseline] = useState<DraftEntry | null>(null);
  const [arrayDrafts, setArrayDrafts] = useState<
    Record<string, Partial<LocaleStringArrays>>
  >({});
  const [hiddenTextKeys, setHiddenTextKeys] = useState<Record<string, true>>({});
  const [arrayBusy, setArrayBusy] = useState<string | null>(null);
  const [flowDrafts, setFlowDrafts] = useState<Record<string, FlowBlock[]>>({});
  const [flowBusy, setFlowBusy] = useState<string | null>(null);
  const [committing, setCommitting] = useState(false);
  const [contactStructureDraft, setContactStructureDraftState] =
    useState<ContactFormStructurePayload | null>(null);
  const [localeManifestDraft, setLocaleManifestDraft] =
    useState<LocaleManifest | null>(null);
  const [pendingLocaleCreates, setPendingLocaleCreates] = useState<string[]>([]);
  const [localeCreateBusy, setLocaleCreateBusy] = useState(false);

  const contactStructureBaseline = useRef<ContactFormStructurePayload | null>(null);
  const localeManifestBaseline = useRef<LocaleManifest | null>(null);

  useEffect(() => {
    fetchContactFormStructure()
      .then((structure) => {
        contactStructureBaseline.current = structure;
      })
      .catch(() => {
        contactStructureBaseline.current = getContactFormStructure();
      });
    fetchLocaleManifest()
      .then((manifest) => {
        localeManifestBaseline.current = manifest;
      })
      .catch(() => {
        localeManifestBaseline.current = getLocaleManifest();
      });
  }, []);

  const setContactStructureDraft = useCallback((structure: ContactFormStructurePayload) => {
    setContactStructureDraftState(structure);
    setRuntimeContactFormStructure(structure);
  }, []);

  const applyLocaleManifestDraft = useCallback((manifest: LocaleManifest) => {
    setLocaleManifestDraft(manifest);
    setRuntimeLocaleManifest(manifest);
  }, []);

  const createLocaleWithFiles = useCallback(
    async (id: string) => {
      setLocaleCreateBusy(true);
      try {
        const result = await createLocale(id);
        const manifest = result.manifest;
        applyLocaleManifestDraft(manifest);
        localeManifestBaseline.current = manifest;
        setPendingLocaleCreates((prev) => prev.filter((localeId) => localeId !== id));
        await ensureLocaleLoaded(id);
        await base.reloadLocales();
      } finally {
        setLocaleCreateBusy(false);
      }
    },
    [applyLocaleManifestDraft, base],
  );

  const displayMessages = useMemo(() => {
    let result = applyArrayDraftsForLocale(base.messages, base.locale, arrayDrafts);
    result = applyFlowDraftsForLocale(result, flowDrafts);
    result = applyArrayItemTextDraftsForLocale(result, base.locale, drafts);
    result = applyDraftsForLocale(result, base.locale, drafts);
    return result;
  }, [base.messages, base.locale, arrayDrafts, flowDrafts, drafts]);

  const t = useCallback(
    (key: string) => tPath(displayMessages, key),
    [displayMessages],
  );

  const localeValue = useMemo(
    () => ({
      locale: base.locale,
      setLocale: base.setLocale,
      messages: displayMessages,
      t,
      reloadLocales: base.reloadLocales,
    }),
    [base.locale, base.setLocale, base.reloadLocales, displayMessages, t],
  );

  const setDraftEntry = useCallback((key: string, entry: DraftEntry) => {
    setDrafts((prev) => {
      const next = { ...prev };
      for (const k of getLinkedTextKeys(key)) {
        next[k] = entry;
      }
      return next;
    });
  }, []);

  const setImageDraft = useCallback((key: string, draft: ImageDraft | null) => {
    setImageDrafts((prev) => {
      const next = { ...prev };
      revokeImageDraft(prev[key]);
      if (draft) next[key] = draft;
      else delete next[key];
      return next;
    });
  }, []);

  const revertDraft = useCallback((key: string) => {
    setDrafts((prev) => {
      const next = { ...prev };
      for (const k of getLinkedTextKeys(key)) {
        delete next[k];
      }
      return next;
    });
  }, []);

  const revertImageDraft = useCallback((key: string) => {
    setImageDrafts((prev) => {
      const next = { ...prev };
      revokeImageDraft(prev[key]);
      delete next[key];
      return next;
    });
  }, []);

  const clearPendingState = useCallback(() => {
    setDrafts({});
    setArrayDrafts({});
    setFlowDrafts({});
    setHiddenTextKeys({});
    setImageDrafts((prev) => {
      for (const d of Object.values(prev)) revokeImageDraft(d);
      return {};
    });
    setContactStructureDraftState(null);
    setLocaleManifestDraft(null);
    setPendingLocaleCreates([]);
    clearRuntimeContactFormStructure();
    clearRuntimeLocaleManifest();
    setSelected(null);
    setPanelBaseline(null);
  }, []);

  const revertAll = useCallback(() => {
    clearPendingState();
    window.dispatchEvent(new Event("phmh-edit-reverted"));
  }, [clearPendingState]);

  const resolveArrayLocales = useCallback(
    async (arrayKey: string): Promise<LocaleStringArrays> => {
      const draft = arrayDrafts[arrayKey];
      if (isCompleteArrayRecord(draft)) return draft;
      return fetchArrayRegistry(arrayKey);
    },
    [arrayDrafts],
  );

  const applyArrayDraft = useCallback((arrayKey: string, locales: LocaleStringArrays) => {
    setArrayDrafts((prev) => ({
      ...prev,
      [arrayKey]: { ...locales },
    }));
  }, []);

  const addArrayItem = useCallback(
    async (arrayKey: string) => {
      setArrayBusy(arrayKey);
      try {
        const current = await resolveArrayLocales(arrayKey);
        const placeholder = newArrayItemValues();
        const next: LocaleStringArrays = Object.fromEntries(
          getActiveLocaleIds().map((id) => [
            id,
            [...(current[id] ?? []), placeholder[id] ?? ""],
          ]),
        );
        applyArrayDraft(arrayKey, next);
        const newIndex = (next[base.locale] ?? []).length - 1;
        if (newIndex >= 0) {
          setDraftEntry(`${arrayKey}.${newIndex}`, localeTextFromArrayItem(next, newIndex));
        }
      } catch (err) {
        window.alert(err instanceof Error ? err.message : String(err));
      } finally {
        setArrayBusy(null);
      }
    },
    [resolveArrayLocales, applyArrayDraft, setDraftEntry, base.locale],
  );

  const removeArrayItem = useCallback(
    async (arrayKey: string, index: number) => {
      if (!window.confirm("이 문단을 삭제할까요?")) return;
      setArrayBusy(arrayKey);
      try {
        const current = await resolveArrayLocales(arrayKey);
        const next: LocaleStringArrays = Object.fromEntries(
          getActiveLocaleIds().map((id) => [
            id,
            (current[id] ?? []).filter((_, i) => i !== index),
          ]),
        );
        applyArrayDraft(arrayKey, next);
        setDrafts((prev) => {
          const copy = { ...prev };
          for (const key of Object.keys(copy)) {
            if (key.startsWith(`${arrayKey}.`)) delete copy[key];
          }
          return copy;
        });
      } catch (err) {
        window.alert(err instanceof Error ? err.message : String(err));
      } finally {
        setArrayBusy(null);
      }
    },
    [resolveArrayLocales, applyArrayDraft],
  );

  const moveArrayItem = useCallback(
    async (arrayKey: string, from: number, to: number) => {
      if (from === to) return;
      setArrayBusy(arrayKey);
      try {
        const current = await resolveArrayLocales(arrayKey);
        const next: LocaleStringArrays = Object.fromEntries(
          getActiveLocaleIds().map((id) => {
            const arr = [...(current[id] ?? [])];
            const [moved] = arr.splice(from, 1);
            arr.splice(to, 0, moved);
            return [id, arr];
          }),
        );
        applyArrayDraft(arrayKey, next);

        setDrafts((prev) => {
          const prefix = `${arrayKey}.`;
          const byIndex = new Map<number, DraftEntry>();
          const copy = { ...prev };
          for (const key of Object.keys(copy)) {
            if (!key.startsWith(prefix)) continue;
            const suffix = key.slice(prefix.length);
            const idx = Number(suffix);
            if (suffix !== String(idx) || Number.isNaN(idx)) continue;
            byIndex.set(idx, copy[key]!);
            delete copy[key];
          }
          if (byIndex.size === 0) return copy;

          const maxIdx = Math.max(...byIndex.keys(), from, to);
          const ordered: (DraftEntry | undefined)[] = [];
          for (let i = 0; i <= maxIdx; i++) {
            ordered[i] = byIndex.get(i);
          }
          const [movedEntry] = ordered.splice(from, 1);
          ordered.splice(to, 0, movedEntry);
          for (let i = 0; i < ordered.length; i++) {
            const entry = ordered[i];
            if (entry) copy[`${arrayKey}.${i}`] = entry;
          }
          return copy;
        });
      } catch (err) {
        window.alert(err instanceof Error ? err.message : String(err));
      } finally {
        setArrayBusy(null);
      }
    },
    [resolveArrayLocales, applyArrayDraft],
  );

  const getSectionFromMessages = useCallback(
    (sectionKey: string): SectionContent => {
      const parts = sectionKey.split(".");
      let current: unknown = displayMessages;
      for (const part of parts) {
        if (current === null || typeof current !== "object") return {};
        current = (current as Record<string, unknown>)[part];
      }
      return (current ?? {}) as SectionContent;
    },
    [displayMessages],
  );

  const resolveFlowBlocks = useCallback(
    (sectionKey: string, section: SectionContent): FlowBlock[] => {
      const raw = flowDrafts[sectionKey] ?? flattenSectionToFlow(section, sectionKey);
      return hydrateFlowBlocks(raw, (key) => tPath(displayMessages, key));
    },
    [flowDrafts, displayMessages],
  );

  const moveFlowBlock = useCallback(
    async (sectionKey: string, from: number, to: number) => {
      if (from === to) return;
      setFlowBusy(sectionKey);
      try {
        const section = getSectionFromMessages(sectionKey);
        const current = flowDrafts[sectionKey] ?? flattenSectionToFlow(section, sectionKey);
        const next = [...current];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        setFlowDrafts((prev) => ({ ...prev, [sectionKey]: next }));
      } finally {
        setFlowBusy(null);
      }
    },
    [flowDrafts, getSectionFromMessages],
  );

  const removeFlowBlock = useCallback(
    async (sectionKey: string, index: number) => {
      if (!window.confirm("이 블록을 삭제할까요?")) return;
      setFlowBusy(sectionKey);
      try {
        const section = getSectionFromMessages(sectionKey);
        const current = flowDrafts[sectionKey] ?? flattenSectionToFlow(section, sectionKey);
        setFlowDrafts((prev) => ({
          ...prev,
          [sectionKey]: current.filter((_, i) => i !== index),
        }));
      } finally {
        setFlowBusy(null);
      }
    },
    [flowDrafts, getSectionFromMessages],
  );

  const insertFlowBlock = useCallback(
    async (
      sectionKey: string,
      index: number,
      type: FlowBlockInsertType,
      options: CreateFlowBlockOptions = {},
    ) => {
      setFlowBusy(sectionKey);
      try {
        const section = getSectionFromMessages(sectionKey);
        const current = flowDrafts[sectionKey] ?? flattenSectionToFlow(section, sectionKey);
        const merged = flowToSectionContent(current);
        const listCount = merged.lists?.length ?? 0;

        let block = createFlowBlock(sectionKey, type, options);
        if (block.type === "bullets") {
          block = {
            ...block,
            listKey: `${sectionKey}.lists.${listCount}`,
          };
        }

        const next = [...current];
        next.splice(index, 0, block);

        const textDraft = draftEntryForNewFlowBlock(block);
        if (textDraft && (block.type === "p" || block.type === "heading" || block.type === "button")) {
          setDraftEntry(block.textKey, textDraft);
        }

        const arrayDraft = arrayDraftForNewFlowBlock(block);
        if (arrayDraft && block.type === "bullets") {
          applyArrayDraft(block.listKey, arrayDraft);
        }

        setFlowDrafts((prev) => ({ ...prev, [sectionKey]: next }));
      } finally {
        setFlowBusy(null);
      }
    },
    [flowDrafts, getSectionFromMessages, setDraftEntry, applyArrayDraft],
  );

  const hideTextKey = useCallback(async (key: string) => {
    if (!window.confirm("이 블록을 삭제할까요?")) return;
    setHiddenTextKeys((prev) => ({ ...prev, [key]: true }));
    revertDraft(key);
  }, [revertDraft]);

  const isTextKeyHidden = useCallback(
    (key: string) => hiddenTextKeys[key] === true,
    [hiddenTextKeys],
  );

  const commitAll = useCallback(async () => {
    setCommitting(true);
    try {
      const savedImageKeys = Object.keys(imageDrafts);
      if (Object.keys(flowDrafts).length > 0) {
        await commitSectionFlowDrafts(flowDrafts);
      }

      await commitPendingEdits({
        drafts,
        arrayDrafts,
        hiddenTextKeys,
        imageDrafts,
        contactStructureDraft,
        contactStructureBaseline: contactStructureBaseline.current,
        localeManifestDraft,
        localeManifestBaseline: localeManifestBaseline.current,
        pendingLocaleCreates,
      });

      if (savedImageKeys.length > 0) {
        setImageCacheBust((prev) => {
          const next = { ...prev };
          const now = Date.now();
          for (const key of savedImageKeys) next[key] = now;
          return next;
        });
      }

      contactStructureBaseline.current =
        contactStructureDraft ?? (await fetchContactFormStructure().catch(() => getContactFormStructure()));
      localeManifestBaseline.current =
        localeManifestDraft ?? (await fetchLocaleManifest().catch(() => getLocaleManifest()));

      clearPendingState();
      await base.reloadLocales();
      window.dispatchEvent(new Event("phmh-edit-committed"));
    } catch (err) {
      window.alert(err instanceof Error ? err.message : String(err));
      throw err;
    } finally {
      setCommitting(false);
    }
  }, [
    drafts,
    arrayDrafts,
    flowDrafts,
    hiddenTextKeys,
    imageDrafts,
    contactStructureDraft,
    localeManifestDraft,
    pendingLocaleCreates,
    clearPendingState,
    base,
  ]);

  const openTextEditor = useCallback((key: string) => {
    setSelected({ key, kind: "text" });
  }, []);

  const openImageEditor = useCallback((key: string) => {
    setSelected({ key, kind: "image" });
  }, []);

  const openContactFieldEditor = useCallback((fieldId: string) => {
    setSelected({ kind: "contactField", fieldId });
  }, []);

  const closeEditor = useCallback(() => {
    setSelected(null);
    setPanelBaseline(null);
    window.dispatchEvent(new Event("phmh-edit-panel-closed"));
  }, []);

  const isEditKeyPending = useCallback(
    (key: string) =>
      checkEditKeyPending(key, {
        drafts,
        imageDrafts,
        hiddenTextKeys,
        arrayDrafts,
      }),
    [drafts, imageDrafts, hiddenTextKeys, arrayDrafts],
  );

  const resolveTextRegistryValues = useCallback(
    async (key: string): Promise<LocaleTextValues> => {
      const draft = findLinkedDraft(drafts, key);
      if (draft) return { ...emptyLocaleTextValues(), ...draft };

      const parsed = parseArrayItemKey(key);
      if (parsed) {
        const arrays = await resolveArrayLocales(parsed.arrayKey);
        return localeTextFromArrayItem(arrays, parsed.index);
      }

      return fetchTextRegistry(key);
    },
    [drafts, resolveArrayLocales],
  );

  const commitTextKey = useCallback(
    async (key: string) => {
      const entry = findLinkedDraft(drafts, key);
      if (!entry) return;
      setCommitting(true);
      try {
        const parsed = parseArrayItemKey(key);
        if (parsed) {
          const current = await resolveArrayLocales(parsed.arrayKey);
          const next = mergeArrayItemIntoLocales(current, parsed.index, entry);
          await patchStringArray(parsed.arrayKey, next);
          applyArrayDraft(parsed.arrayKey, next);
        } else {
          for (const k of getLinkedTextKeys(key)) {
            await patchText(k, entry);
          }
        }
        setDrafts((prev) => {
          const next = { ...prev };
          for (const k of getLinkedTextKeys(key)) {
            delete next[k];
          }
          return next;
        });
        await base.reloadLocales();
        window.dispatchEvent(new Event("phmh-edit-committed"));
      } catch (err) {
        window.alert(err instanceof Error ? err.message : String(err));
        throw err;
      } finally {
        setCommitting(false);
      }
    },
    [drafts, resolveArrayLocales, applyArrayDraft, base],
  );

  const commitImageKey = useCallback(
    async (key: string) => {
      const draft = imageDrafts[key];
      const entry = getImageRegistryEntry(key);
      if (!draft || !entry) return;
      setCommitting(true);
      try {
        const buffer = await draft.file.arrayBuffer();
        const base64 = arrayBufferToBase64(buffer);
        await writeImageFile(entry.file, base64, draft.file.type);
        setImageDrafts((prev) => {
          const next = { ...prev };
          revokeImageDraft(prev[key]);
          delete next[key];
          return next;
        });
        setImageCacheBust((prev) => ({ ...prev, [key]: Date.now() }));
        await base.reloadLocales();
        window.dispatchEvent(new Event("phmh-edit-committed"));
      } catch (err) {
        window.alert(err instanceof Error ? err.message : String(err));
        throw err;
      } finally {
        setCommitting(false);
      }
    },
    [imageDrafts, base],
  );

  const getImagePreviewSrc = useCallback(
    (key: string, committedSrc: string) => {
      const draft = imageDrafts[key];
      if (draft) return draft.previewUrl;
      const v = imageCacheBust[key];
      if (v) {
        const sep = committedSrc.includes("?") ? "&" : "?";
        return `${committedSrc}${sep}v=${v}`;
      }
      return committedSrc;
    },
    [imageDrafts, imageCacheBust],
  );

  const uniqueTextDraftCount = useMemo(() => {
    const groups = new Set<string>();
    for (const key of Object.keys(drafts)) {
      groups.add(getLinkedTextKeyGroupId(key));
    }
    return groups.size;
  }, [drafts]);

  const pendingCount =
    uniqueTextDraftCount +
    Object.keys(imageDrafts).length +
    Object.keys(hiddenTextKeys).length +
    Object.keys(arrayDrafts).length +
    Object.keys(flowDrafts).length +
    pendingLocaleCreates.length +
    (isContactStructureDirty(contactStructureDraft, contactStructureBaseline.current) ? 1 : 0) +
    (isLocaleManifestDirty(localeManifestDraft, localeManifestBaseline.current) ? 1 : 0);

  const draftCtx = useMemo(
    () => ({
      drafts,
      imageDrafts,
      pendingCount,
      committing,
      selected,
      openTextEditor,
      openImageEditor,
      openContactFieldEditor,
      closeEditor,
      setDraftEntry,
      setImageDraft,
      revertDraft,
      revertImageDraft,
      revertAll,
      commitAll,
      commitTextKey,
      resolveTextRegistryValues,
      commitImageKey,
      isEditKeyPending,
      panelBaseline,
      setPanelBaseline,
      getImagePreviewSrc,
      arrayBusy,
      isTextKeyHidden,
      addArrayItem,
      removeArrayItem,
      moveArrayItem,
      flowBusy,
      resolveFlowBlocks,
      moveFlowBlock,
      removeFlowBlock,
      insertFlowBlock,
      hideTextKey,
      contactStructureDraft,
      setContactStructureDraft,
      localeManifestDraft,
      applyLocaleManifestDraft,
      createLocaleWithFiles,
      localeCreateBusy,
      applyArrayDraft,
    }),
    [
      drafts,
      imageDrafts,
      pendingCount,
      committing,
      selected,
      openTextEditor,
      openImageEditor,
      openContactFieldEditor,
      closeEditor,
      setDraftEntry,
      setImageDraft,
      revertDraft,
      revertImageDraft,
      revertAll,
      commitAll,
      commitTextKey,
      resolveTextRegistryValues,
      commitImageKey,
      isEditKeyPending,
      panelBaseline,
      getImagePreviewSrc,
      arrayBusy,
      isTextKeyHidden,
      addArrayItem,
      removeArrayItem,
      moveArrayItem,
      flowBusy,
      resolveFlowBlocks,
      moveFlowBlock,
      removeFlowBlock,
      insertFlowBlock,
      hideTextKey,
      contactStructureDraft,
      setContactStructureDraft,
      localeManifestDraft,
      applyLocaleManifestDraft,
      createLocaleWithFiles,
      localeCreateBusy,
      applyArrayDraft,
    ],
  );

  return (
    <EditDraftContext.Provider value={draftCtx}>
      <LocaleContext.Provider value={localeValue}>{children}</LocaleContext.Provider>
    </EditDraftContext.Provider>
  );
}
