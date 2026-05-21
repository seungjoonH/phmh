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
import { usePathname } from "next/navigation";
import { LocaleContext, useLocale } from "@/components/i18n/LocaleProvider";
import { DEFAULT_HERO_LIGHT } from "@/lib/default-hero";
import { tPath } from "@/lib/i18n/messages";
import { commitLongFormSectionDrafts } from "@/lib/edit/commit-long-form-sections";
import { commitSectionFlowDrafts } from "@/lib/edit/commit-section-flow";
import {
  commitPendingEdits,
  computeTherapistTargetSlug,
  isContactStructureDirty,
  isLocaleManifestDirty,
  isSitePagesHiddenDirty,
  isSitePagesOrderDirty,
  isTherapistOrderDirty,
} from "@/lib/edit/commit-pending";
import {
  emptyLocaleTextValues,
  isCompleteArrayRecord,
  isCompleteStepsRecord,
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
  applyLongFormSectionDraftsForLocale,
  applyStepFieldDraftsForLocale,
  applyStepsDraftsForLocale,
} from "@/lib/edit/messages";
import {
  defaultLongFormSectionByLocales,
  generateLongFormSectionSlug,
  sectionTitleEditKey,
  sectionsPathFromOrderKey,
  type LongFormSectionsDraftEntry,
} from "@/lib/edit/long-form-section";
import {
  defaultNewStep,
  localeTextFromStepField,
  mergeStepFieldIntoLocales,
  parseStepFieldKey,
  renumberSteps,
  remapStepFieldDraftsAfterMove,
  removeStepFieldDrafts,
  shiftStepFieldDraftsOnInsert,
} from "@/lib/edit/getting-started-step";
import {
  arrayDraftForNewFlowBlock,
  createFlowBlock,
  draftEntryForNewFlowBlock,
  type CreateFlowBlockOptions,
} from "@/lib/edit/flow-block-factory";
import {
  ensurePrependBlocks,
  flattenSectionToFlow,
  hydrateFlowBlocks,
  stripPrependBlocks,
  type FlowBlock,
  type FlowBlockInsertType,
  type SectionContent,
} from "@/lib/edit/section-flow";
import {
  createLocale,
  applyCenterImagesDraft,
  fetchArrayRegistry,
  fetchContactFormStructure,
  fetchLocaleManifest,
  fetchSitePagesRegistry,
  fetchStepsRegistry,
  fetchTextRegistry,
  patchCentersOrder,
  patchCenter,
  patchTherapist,
  patchStepsArray,
  patchStringArray,
  patchText,
  patchTherapistsOrder,
  putSitePagesOrder,
  renameTherapist,
  writeImageFile,
  type ContactFormStructurePayload,
  type LocaleStepsArrays,
  type LocaleStringArrays,
  type LocaleTextValues,
} from "@/lib/edit/client";
import {
  clearRuntimeSiteOrder,
  clearRuntimeVisibility,
  setRuntimeSiteOrder,
  setRuntimeVisibility,
} from "@/lib/site-pages-visibility";
import {
  clearRuntimeCenterOrder,
  setRuntimeCenterOrder,
} from "@/lib/centers/manifest";
import {
  clearRuntimeTherapistOrder,
  setRuntimeTherapistOrder,
} from "@/lib/therapists/manifest";
import type { SitePageGroup } from "@/lib/site-pages";
import { ensureLocaleLoaded } from "@/lib/i18n/load-locale";
import { arrayBufferToBase64 } from "@/lib/edit/array-buffer-to-base64";
import { getImageRegistryEntry } from "@/lib/edit/image-registry";
import {
  findLinkedDraft,
  getLinkedTextKeys,
} from "@/lib/edit/linked-text-keys";
import {
  applyCenterFieldLocales,
  applyCenterTitleLocales,
  getCenterLinkedTextKeys,
  parseCenterFieldKey,
  readCenterFieldLocales,
} from "@/lib/edit/center-edit-key";
import { getCenterBySlug } from "@/lib/centers/load";
import { setCenterRuntime } from "@/lib/centers/runtime";
import {
  countPendingChanges,
  isEditKeyPending as checkEditKeyPending,
  type PendingCheckContext,
} from "@/lib/edit/pending-keys";
import {
  applyTherapistArrayLocales,
  applyTherapistFieldLocales,
  applyTherapistNameLocales,
  getTherapistLinkedTextKeys,
  parseTherapistArrayKey,
  parseTherapistFieldKey,
  readTherapistArrayLocales,
  readTherapistFieldLocales,
} from "@/lib/edit/therapist-edit-key";
import { getTherapistBySlug } from "@/lib/therapists/load";
import {
  clearTherapistRuntime,
  renameTherapistRuntime,
  setTherapistRuntime,
} from "@/lib/therapists/runtime";
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
import {
  DEFAULT_PORTRAIT_LIGHT,
  isTherapistPortraitKey,
} from "@/lib/therapists/default-portrait";
import { confirm as showConfirm, showAlert } from "@/components/ui/AppDialog";

export type DraftEntry = LocaleTextValues;

export type ImageDraft = {
  previewUrl: string;
  file: File;
};

export type CenterImageDraftItem = {
  id: string;
  src: string;
  file?: File;
  previewUrl?: string;
};

export type CenterImagesDraft = {
  baseline: Array<{ id: string; src: string }>;
  items: CenterImageDraftItem[];
};

type SelectedTarget =
  | { key: string; kind: "text" | "image" | "list" }
  | { kind: "contactField"; fieldId: string };

function isGeneratedFlowTextKey(key: string): boolean {
  return /\.flowText\.[^.]+\.(p|heading|sectionTitle|button)$/.test(key);
}

function findFlowBlockBySectionAndList(
  flowDrafts: Record<string, FlowBlock[]>,
  listKey: string,
): { sectionKey: string; index: number; block: Extract<FlowBlock, { type: "list" }> } | null {
  for (const [sectionKey, blocks] of Object.entries(flowDrafts)) {
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      if (block.type === "list" && block.listKey === listKey) {
        return { sectionKey, index: i, block };
      }
    }
  }
  return null;
}

type EditDraftContextValue = {
  drafts: Record<string, DraftEntry>;
  imageDrafts: Record<string, ImageDraft>;
  centerImageDrafts: Record<string, CenterImagesDraft>;
  pendingCount: number;
  committing: boolean;
  selected: SelectedTarget | null;
  openTextEditor: (key: string) => void;
  openImageEditor: (key: string) => void;
  openListEditor: (listKey: string) => void;
  openContactFieldEditor: (fieldId: string) => void;
  closeEditor: () => void;
  setDraftEntry: (key: string, entry: DraftEntry) => void;
  setImageDraft: (key: string, draft: ImageDraft | null) => void;
  setCenterImagesDraft: (slug: string, draft: CenterImagesDraft | null) => void;
  getCenterImagesDraft: (slug: string) => CenterImagesDraft | undefined;
  isCenterImagesPending: (slug: string) => boolean;
  imageDeleteDrafts: Record<string, true>;
  markImageDelete: (key: string) => void;
  unmarkImageDelete: (key: string) => void;
  isImagePendingDelete: (key: string) => boolean;
  revertDraft: (key: string) => void;
  revertArrayDraft: (arrayKey: string) => void;
  revertImageDraft: (key: string) => void;
  revertAll: () => void;
  commitAll: () => Promise<void>;
  commitTextKey: (key: string) => Promise<void>;
  resolveTextRegistryValues: (key: string) => Promise<LocaleTextValues>;
  resolveCommittedTextRegistryValues: (key: string) => Promise<LocaleTextValues>;
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
  stepsBusy: string | null;
  insertStep: (arrayKey: string, index: number) => Promise<void>;
  removeStep: (arrayKey: string, index: number) => Promise<void>;
  moveStep: (arrayKey: string, from: number, to: number) => Promise<void>;
  flowBusy: string | null;
  resolveFlowBlocks: (
    sectionKey: string,
    section: SectionContent,
    options?: { prepend?: FlowBlock[] },
  ) => FlowBlock[];
  moveFlowBlock: (sectionKey: string, from: number, to: number) => Promise<void>;
  removeFlowBlock: (sectionKey: string, index: number) => Promise<void>;
  insertFlowBlock: (
    sectionKey: string,
    index: number,
    type: FlowBlockInsertType,
    options?: CreateFlowBlockOptions,
  ) => Promise<void>;
  /** 목록(list) 블록의 ordered/items 갱신 */
  updateListBlock: (
    listKey: string,
    update: { ordered: boolean; items: string[] },
  ) => Promise<void>;
  /** 현재 messages 트리에서 list 블록 정보 조회 */
  lookupListBlock: (listKey: string) => {
    sectionKey: string;
    block: Extract<FlowBlock, { type: "list" }>;
  } | null;
  hideTextKey: (key: string) => Promise<void>;
  contactStructureDraft: ContactFormStructurePayload | null;
  setContactStructureDraft: (structure: ContactFormStructurePayload | null) => void;
  localeManifestDraft: LocaleManifest | null;
  applyLocaleManifestDraft: (manifest: LocaleManifest) => void;
  createLocaleWithFiles: (id: string) => Promise<void>;
  localeCreateBusy: boolean;
  applyArrayDraft: (arrayKey: string, locales: LocaleStringArrays) => void;
  arrayDrafts: Record<string, Partial<LocaleStringArrays>>;
  applyTherapistArrayPreview: (
    arrayKey: string,
    locales: LocaleStringArrays,
    ordered?: boolean,
  ) => void;
  removeContactFieldDrafts: (fieldId: string) => void;
  sitePagesHiddenDraft: string[] | null;
  setSitePagesHiddenDraft: (hidden: string[]) => void;
  sitePagesTopOrderDraft: string[] | null;
  sitePagesGroupOrderDraft: Record<string, string[]> | null;
  sitePagesCenterOrderDraft: string[] | null;
  sitePagesTherapistOrderDraft: string[] | null;
  setSitePagesTopOrderDraft: (order: string[]) => void;
  setSitePagesGroupOrderDraft: (group: SitePageGroup, order: string[]) => void;
  setSitePagesCenterOrderDraft: (order: string[]) => void;
  setSitePagesTherapistOrderDraft: (order: string[]) => void;
  /** 상담사 blocks 구조 변경(추가/삭제/이동) dirty 표시 — 즉시 저장 금지 */
  markTherapistBlocksDirty: (slug: string) => void;
  longFormSectionBusy: string | null;
  insertLongFormSection: (sectionOrderKey: string, index: number) => Promise<void>;
  removeLongFormSection: (sectionOrderKey: string, index: number) => Promise<void>;
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

function revokeCenterImagesDraft(draft: CenterImagesDraft | undefined) {
  for (const item of draft?.items ?? []) {
    if (item.previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(item.previewUrl);
    }
  }
}

function centerImagesSignature(items: Array<{ id: string; src: string }>) {
  return JSON.stringify(items.map((item) => ({ id: item.id, src: item.src })));
}

function revokeRemovedCenterImagePreviews(
  previous: CenterImagesDraft | undefined,
  nextDraft: CenterImagesDraft,
) {
  const kept = new Set(
    nextDraft.items
      .map((item) => item.previewUrl)
      .filter((src): src is string => Boolean(src)),
  );
  for (const item of previous?.items ?? []) {
    if (item.previewUrl?.startsWith("blob:") && !kept.has(item.previewUrl)) {
      URL.revokeObjectURL(item.previewUrl);
    }
  }
}

export function EditDraftProvider({ children }: { children: ReactNode }) {
  const base = useLocale();
  const [drafts, setDrafts] = useState<Record<string, DraftEntry>>({});
  const [imageDrafts, setImageDrafts] = useState<Record<string, ImageDraft>>({});
  const [centerImageDrafts, setCenterImageDrafts] = useState<
    Record<string, CenterImagesDraft>
  >({});
  const [imageDeleteDrafts, setImageDeleteDrafts] = useState<Record<string, true>>({});
  const [imageCacheBust, setImageCacheBust] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<SelectedTarget | null>(null);
  const [panelBaseline, setPanelBaseline] = useState<DraftEntry | null>(null);
  const [arrayDrafts, setArrayDrafts] = useState<
    Record<string, Partial<LocaleStringArrays>>
  >({});
  const [hiddenTextKeys, setHiddenTextKeys] = useState<Record<string, true>>({});
  const [arrayBusy, setArrayBusy] = useState<string | null>(null);
  const [flowDrafts, setFlowDrafts] = useState<Record<string, FlowBlock[]>>({});
  /** ServiceSection 이 resolve 시 넘긴 prepend — 편집 mutation 과 화면 인덱스 SSOT */
  const flowPrependRef = useRef<Record<string, FlowBlock[]>>({});
  const [stepsDrafts, setStepsDrafts] = useState<
    Record<string, Partial<LocaleStepsArrays>>
  >({});
  const [flowBusy, setFlowBusy] = useState<string | null>(null);
  const [longFormSectionDrafts, setLongFormSectionDrafts] = useState<
    Record<string, LongFormSectionsDraftEntry>
  >({});
  const [longFormSectionBusy, setLongFormSectionBusy] = useState<string | null>(
    null,
  );
  const [stepsBusy, setStepsBusy] = useState<string | null>(null);
  const [committing, setCommitting] = useState(false);
  const [contactStructureDraft, setContactStructureDraftState] =
    useState<ContactFormStructurePayload | null>(null);
  const draftsRef = useRef(drafts);
  const arrayDraftsRef = useRef(arrayDrafts);
  const stepsDraftsRef = useRef(stepsDrafts);
  const [localeManifestDraft, setLocaleManifestDraft] =
    useState<LocaleManifest | null>(null);
  const [pendingLocaleCreates, setPendingLocaleCreates] = useState<string[]>([]);
  const [localeCreateBusy, setLocaleCreateBusy] = useState(false);
  const [sitePagesHiddenDraft, setSitePagesHiddenDraftState] = useState<string[] | null>(
    null,
  );
  const [sitePagesTopOrderDraft, setSitePagesTopOrderDraftState] = useState<
    string[] | null
  >(null);
  const [sitePagesGroupOrderDraft, setSitePagesGroupOrderDraftState] = useState<
    Record<string, string[]> | null
  >(null);
  const [sitePagesCenterOrderDraft, setSitePagesCenterOrderDraftState] =
    useState<string[] | null>(null);
  const [sitePagesTherapistOrderDraft, setSitePagesTherapistOrderDraftState] =
    useState<string[] | null>(null);
  const [therapistBlocksDirty, setTherapistBlocksDirty] = useState<
    Record<string, true>
  >({});

  const contactStructureBaseline = useRef<ContactFormStructurePayload | null>(null);
  const localeManifestBaseline = useRef<LocaleManifest | null>(null);
  const sitePagesHiddenBaseline = useRef<string[] | null>(null);
  const sitePagesTopOrderBaseline = useRef<string[] | null>(null);
  const sitePagesGroupOrderBaseline = useRef<Record<string, string[]> | null>(null);
  const sitePagesCenterOrderBaseline = useRef<string[] | null>(null);
  const sitePagesTherapistOrderBaseline = useRef<string[] | null>(null);

  useEffect(() => {
    draftsRef.current = drafts;
  }, [drafts]);

  useEffect(() => {
    arrayDraftsRef.current = arrayDrafts;
  }, [arrayDrafts]);

  useEffect(() => {
    stepsDraftsRef.current = stepsDrafts;
  }, [stepsDrafts]);

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
    fetchSitePagesRegistry()
      .then((data) => {
        sitePagesHiddenBaseline.current = data.hidden ?? [];
        sitePagesTopOrderBaseline.current = data.topOrder ?? [];
        sitePagesGroupOrderBaseline.current = data.groupOrder ?? {};
        sitePagesCenterOrderBaseline.current = data.centerSlugs ?? [];
        sitePagesTherapistOrderBaseline.current = data.therapistSlugs ?? [];
      })
      .catch(() => {
        sitePagesHiddenBaseline.current = [];
        sitePagesTopOrderBaseline.current = [];
        sitePagesGroupOrderBaseline.current = {};
        sitePagesCenterOrderBaseline.current = [];
        sitePagesTherapistOrderBaseline.current = [];
      });
  }, []);

  const setSitePagesHiddenDraft = useCallback((hidden: string[]) => {
    const next = [...new Set(hidden)];
    setSitePagesHiddenDraftState(next);
    setRuntimeVisibility(next);
    window.dispatchEvent(new Event("phmh-edit-visibility-changed"));
  }, []);

  const setSitePagesTopOrderDraft = useCallback((order: string[]) => {
    const next = [...order];
    setSitePagesTopOrderDraftState(next);
    setRuntimeSiteOrder({ topOrder: next });
    window.dispatchEvent(new Event("phmh-edit-visibility-changed"));
  }, []);

  const setSitePagesGroupOrderDraft = useCallback(
    (group: SitePageGroup, order: string[]) => {
      const base = sitePagesGroupOrderDraft ?? sitePagesGroupOrderBaseline.current ?? {};
      const next = { ...base, [group]: [...order] };
      setSitePagesGroupOrderDraftState(next);
      setRuntimeSiteOrder({ groupOrder: next });
      window.dispatchEvent(new Event("phmh-edit-visibility-changed"));
    },
    [sitePagesGroupOrderDraft],
  );

  const setSitePagesTherapistOrderDraft = useCallback((order: string[]) => {
    const next = [...order];
    setSitePagesTherapistOrderDraftState(next);
    setRuntimeTherapistOrder(next);
    window.dispatchEvent(new Event("phmh-edit-visibility-changed"));
  }, []);

  const setSitePagesCenterOrderDraft = useCallback((order: string[]) => {
    const next = [...order];
    setSitePagesCenterOrderDraftState(next);
    setRuntimeCenterOrder(next);
    window.dispatchEvent(new Event("phmh-edit-visibility-changed"));
  }, []);

  const setContactStructureDraft = useCallback(
    (structure: ContactFormStructurePayload | null) => {
      setContactStructureDraftState(structure);
      if (structure) setRuntimeContactFormStructure(structure);
      else clearRuntimeContactFormStructure();
    },
    [],
  );

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
    result = applyLongFormSectionDraftsForLocale(
      result,
      base.locale,
      longFormSectionDrafts,
    );
    result = applyStepsDraftsForLocale(result, base.locale, stepsDrafts);
    result = applyFlowDraftsForLocale(result, flowDrafts);
    result = applyStepFieldDraftsForLocale(result, base.locale, drafts);
    result = applyArrayItemTextDraftsForLocale(result, base.locale, drafts);
    result = applyDraftsForLocale(result, base.locale, drafts);
    return result;
  }, [
    base.messages,
    base.locale,
    arrayDrafts,
    longFormSectionDrafts,
    stepsDrafts,
    flowDrafts,
    drafts,
  ]);

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
      draftsRef.current = next;
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
    if (draft) {
      // 새 파일을 올리면 동일 키의 삭제 예약은 자동 해제
      setImageDeleteDrafts((prev) => {
        if (!prev[key]) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }, []);

  const setCenterImagesDraft = useCallback(
    (slug: string, draft: CenterImagesDraft | null) => {
      setCenterImageDrafts((prev) => {
        const next = { ...prev };
        const previous = prev[slug];
        if (!draft) {
          revokeCenterImagesDraft(previous);
          delete next[slug];
          return next;
        }
        const baselineSig = centerImagesSignature(draft.baseline);
        const itemSig = centerImagesSignature(draft.items);
        if (baselineSig === itemSig) {
          revokeCenterImagesDraft(previous);
          revokeCenterImagesDraft(draft);
          delete next[slug];
          return next;
        }
        revokeRemovedCenterImagePreviews(previous, draft);
        next[slug] = draft;
        return next;
      });
    },
    [],
  );

  const getCenterImagesDraft = useCallback(
    (slug: string) => centerImageDrafts[slug],
    [centerImageDrafts],
  );

  const isCenterImagesPending = useCallback(
    (slug: string) => Boolean(centerImageDrafts[slug]),
    [centerImageDrafts],
  );

  const markImageDelete = useCallback((key: string) => {
    setImageDeleteDrafts((prev) => ({ ...prev, [key]: true }));
    setImageDrafts((prev) => {
      if (!prev[key]) return prev;
      revokeImageDraft(prev[key]);
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const unmarkImageDelete = useCallback((key: string) => {
    setImageDeleteDrafts((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const isImagePendingDelete = useCallback(
    (key: string) => Boolean(imageDeleteDrafts[key]),
    [imageDeleteDrafts],
  );

  const revertDraft = useCallback((key: string) => {
    setDrafts((prev) => {
      const next = { ...prev };
      for (const k of getLinkedTextKeys(key)) {
        delete next[k];
      }
      draftsRef.current = next;
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
    setImageDeleteDrafts((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const markTherapistBlocksDirty = useCallback((slug: string) => {
    setTherapistBlocksDirty((prev) => (prev[slug] ? prev : { ...prev, [slug]: true }));
  }, []);

  const clearPendingState = useCallback(() => {
    setDrafts({});
    setArrayDrafts({});
    setStepsDrafts({});
    draftsRef.current = {};
    arrayDraftsRef.current = {};
    stepsDraftsRef.current = {};
    setFlowDrafts({});
    setLongFormSectionDrafts({});
    setHiddenTextKeys({});
    setTherapistBlocksDirty({});
    setImageDrafts((prev) => {
      for (const d of Object.values(prev)) revokeImageDraft(d);
      return {};
    });
    setCenterImageDrafts((prev) => {
      for (const d of Object.values(prev)) revokeCenterImagesDraft(d);
      return {};
    });
    setImageDeleteDrafts({});
    setContactStructureDraftState(null);
    setLocaleManifestDraft(null);
    setPendingLocaleCreates([]);
    setSitePagesHiddenDraftState(null);
    setSitePagesTopOrderDraftState(null);
    setSitePagesGroupOrderDraftState(null);
    setSitePagesCenterOrderDraftState(null);
    setSitePagesTherapistOrderDraftState(null);
    clearRuntimeContactFormStructure();
    clearRuntimeLocaleManifest();
    clearRuntimeVisibility();
    clearRuntimeSiteOrder();
    clearRuntimeCenterOrder();
    clearRuntimeTherapistOrder();
    clearTherapistRuntime();
    setSelected(null);
    setPanelBaseline(null);
    window.dispatchEvent(new Event("phmh-edit-visibility-changed"));
  }, []);

  const revertAll = useCallback(() => {
    clearPendingState();
    window.dispatchEvent(new Event("phmh-edit-reverted"));
  }, [clearPendingState]);

  const pathname = usePathname();

  // 페이지 이동 시 미저장 변경 전부 폐기 — 새로고침과 동일하게 committed 상태만 표시.
  useEffect(() => {
    clearPendingState();
    window.dispatchEvent(new Event("phmh-edit-reverted"));
  }, [pathname, clearPendingState]);

  const resolveArrayLocales = useCallback(
    async (arrayKey: string): Promise<LocaleStringArrays> => {
      const draft = arrayDraftsRef.current[arrayKey];
      if (isCompleteArrayRecord(draft)) return draft;
      const therapistArray = parseTherapistArrayKey(arrayKey);
      if (therapistArray) {
        const record = getTherapistBySlug(therapistArray.slug);
        if (!record) {
          return Object.fromEntries(
            getActiveLocaleIds().map((id) => [id, []]),
          ) as LocaleStringArrays;
        }
        return readTherapistArrayLocales(record, therapistArray);
      }
      return fetchArrayRegistry(arrayKey);
    },
    [],
  );

  const applyArrayDraft = useCallback((arrayKey: string, locales: LocaleStringArrays) => {
    setArrayDrafts((prev) => {
      const next = {
        ...prev,
        [arrayKey]: { ...locales },
      };
      arrayDraftsRef.current = next;
      return next;
    });
  }, []);

  const revertArrayDraft = useCallback((arrayKey: string) => {
    setArrayDrafts((prev) => {
      if (!prev[arrayKey]) return prev;
      const next = { ...prev };
      delete next[arrayKey];
      arrayDraftsRef.current = next;
      return next;
    });
  }, []);

  const applyTherapistArrayPreview = useCallback(
    (arrayKey: string, locales: LocaleStringArrays, ordered?: boolean) => {
      applyArrayDraft(arrayKey, locales);
      const ref = parseTherapistArrayKey(arrayKey);
      if (!ref) return;
      const record = getTherapistBySlug(ref.slug);
      if (!record) return;
      setTherapistRuntime(
        ref.slug,
        applyTherapistArrayLocales(record, ref, locales, ordered),
      );
    },
    [applyArrayDraft],
  );

  const removeContactFieldDrafts = useCallback((fieldId: string) => {
    const prefix = `contactForm.fields.${fieldId}.`;
    setDrafts((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const key of Object.keys(next)) {
        if (key.startsWith(prefix)) {
          delete next[key];
          changed = true;
        }
      }
      if (changed) draftsRef.current = next;
      return changed ? next : prev;
    });
    setArrayDrafts((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const key of Object.keys(next)) {
        if (key.startsWith(prefix)) {
          delete next[key];
          changed = true;
        }
      }
      if (changed) arrayDraftsRef.current = next;
      return changed ? next : prev;
    });
  }, []);

  const applyStepsDraft = useCallback((arrayKey: string, locales: LocaleStepsArrays) => {
    setStepsDrafts((prev) => {
      const next = {
        ...prev,
        [arrayKey]: { ...locales },
      };
      stepsDraftsRef.current = next;
      return next;
    });
  }, []);

  const resolveStepsLocales = useCallback(
    async (arrayKey: string): Promise<LocaleStepsArrays> => {
      const draft = stepsDraftsRef.current[arrayKey];
      if (isCompleteStepsRecord(draft)) return draft;
      return fetchStepsRegistry(arrayKey);
    },
    [],
  );

  const insertStep = useCallback(
    async (arrayKey: string, index: number) => {
      setStepsBusy(arrayKey);
      try {
        const current = await resolveStepsLocales(arrayKey);
        const next: LocaleStepsArrays = Object.fromEntries(
          getActiveLocaleIds().map((id) => {
            const steps = [...(current[id] ?? [])];
            steps.splice(index, 0, defaultNewStep(index));
            return [id, renumberSteps(steps)];
          }),
        ) as LocaleStepsArrays;
        applyStepsDraft(arrayKey, next);
        setDrafts((prev) => shiftStepFieldDraftsOnInsert(prev, arrayKey, index));
      } catch (err) {
        await showAlert(err instanceof Error ? err.message : String(err));
      } finally {
        setStepsBusy(null);
      }
    },
    [resolveStepsLocales, applyStepsDraft],
  );

  const removeStep = useCallback(
    async (arrayKey: string, index: number) => {
      if (!(await showConfirm({ message: "이 스텝을 삭제할까요?", danger: true }))) return;
      setStepsBusy(arrayKey);
      try {
        const current = await resolveStepsLocales(arrayKey);
        const next: LocaleStepsArrays = Object.fromEntries(
          getActiveLocaleIds().map((id) => [
            id,
            renumberSteps((current[id] ?? []).filter((_, i) => i !== index)),
          ]),
        ) as LocaleStepsArrays;
        applyStepsDraft(arrayKey, next);
        setDrafts((prev) => removeStepFieldDrafts(prev, arrayKey, index));
      } catch (err) {
        await showAlert(err instanceof Error ? err.message : String(err));
      } finally {
        setStepsBusy(null);
      }
    },
    [resolveStepsLocales, applyStepsDraft],
  );

  const moveStep = useCallback(
    async (arrayKey: string, from: number, to: number) => {
      if (from === to) return;
      setStepsBusy(arrayKey);
      try {
        const current = await resolveStepsLocales(arrayKey);
        const next: LocaleStepsArrays = Object.fromEntries(
          getActiveLocaleIds().map((id) => {
            const steps = [...(current[id] ?? [])];
            const [moved] = steps.splice(from, 1);
            steps.splice(to, 0, moved);
            return [id, renumberSteps(steps)];
          }),
        ) as LocaleStepsArrays;
        applyStepsDraft(arrayKey, next);
        setDrafts((prev) => remapStepFieldDraftsAfterMove(prev, arrayKey, from, to));
      } catch (err) {
        await showAlert(err instanceof Error ? err.message : String(err));
      } finally {
        setStepsBusy(null);
      }
    },
    [resolveStepsLocales, applyStepsDraft],
  );

  const addArrayItem = useCallback(
    async (arrayKey: string) => {
      setArrayBusy(arrayKey);
      try {
        const current = await resolveArrayLocales(arrayKey);
        const next: LocaleStringArrays = Object.fromEntries(
          getActiveLocaleIds().map((id) => [
            id,
            [...(current[id] ?? []), ""],
          ]),
        );
        applyArrayDraft(arrayKey, next);
        const newIndex = (next[base.locale] ?? []).length - 1;
        if (newIndex >= 0) {
          setDraftEntry(`${arrayKey}.${newIndex}`, localeTextFromArrayItem(next, newIndex));
        }
      } catch (err) {
        await showAlert(err instanceof Error ? err.message : String(err));
      } finally {
        setArrayBusy(null);
      }
    },
    [resolveArrayLocales, applyArrayDraft, setDraftEntry, base.locale],
  );

  const removeArrayItem = useCallback(
    async (arrayKey: string, index: number) => {
      if (!(await showConfirm({ message: "이 문단을 삭제할까요?", danger: true }))) return;
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
        await showAlert(err instanceof Error ? err.message : String(err));
      } finally {
        setArrayBusy(null);
      }
    },
    [resolveArrayLocales, applyArrayDraft],
  );

  const insertLongFormSection = useCallback(
    async (sectionOrderKey: string, index: number) => {
      setLongFormSectionBusy(sectionOrderKey);
      try {
        const slug = generateLongFormSectionSlug();
        const current = await resolveArrayLocales(sectionOrderKey);
        const sectionByLocale = defaultLongFormSectionByLocales(sectionOrderKey);
        const nextOrder: LocaleStringArrays = Object.fromEntries(
          getActiveLocaleIds().map((id) => {
            const order = [...(current[id] ?? [])];
            order.splice(index, 0, slug);
            return [id, order];
          }),
        );
        applyArrayDraft(sectionOrderKey, nextOrder);
        setLongFormSectionDrafts((prev) => {
          const entry = prev[sectionOrderKey] ?? { added: {}, removed: [] };
          return {
            ...prev,
            [sectionOrderKey]: {
              added: { ...entry.added, [slug]: sectionByLocale },
              removed: entry.removed,
            },
          };
        });
        const titleEntry = Object.fromEntries(
          getActiveLocaleIds().map((id) => [
            id,
            sectionByLocale[id]?.title ?? "",
          ]),
        ) as LocaleTextValues;
        setDraftEntry(sectionTitleEditKey(sectionOrderKey, slug), titleEntry);
      } catch (err) {
        await showAlert(err instanceof Error ? err.message : String(err));
      } finally {
        setLongFormSectionBusy(null);
      }
    },
    [resolveArrayLocales, applyArrayDraft, setDraftEntry],
  );

  const removeLongFormSection = useCallback(
    async (sectionOrderKey: string, index: number) => {
      if (
        !(await showConfirm({
          message: "이 섹션을 삭제할까요?",
          danger: true,
        }))
      ) {
        return;
      }
      setLongFormSectionBusy(sectionOrderKey);
      try {
        const current = await resolveArrayLocales(sectionOrderKey);
        const slug = current[base.locale]?.[index];
        if (!slug) return;

        const nextOrder: LocaleStringArrays = Object.fromEntries(
          getActiveLocaleIds().map((id) => [
            id,
            (current[id] ?? []).filter((_, i) => i !== index),
          ]),
        );
        applyArrayDraft(sectionOrderKey, nextOrder);

        const sectionsPath = sectionsPathFromOrderKey(sectionOrderKey);
        const sectionPrefix = `${sectionsPath}.${slug}`;

        setLongFormSectionDrafts((prev) => {
          const entry = prev[sectionOrderKey] ?? { added: {}, removed: [] };
          const wasAdded = Boolean(entry.added[slug]);
          const nextAdded = { ...entry.added };
          delete nextAdded[slug];
          return {
            ...prev,
            [sectionOrderKey]: {
              added: nextAdded,
              removed: wasAdded ? entry.removed : [...entry.removed, slug],
            },
          };
        });

        setDrafts((prev) => {
          const copy = { ...prev };
          for (const key of Object.keys(copy)) {
            if (key === sectionPrefix || key.startsWith(`${sectionPrefix}.`)) {
              delete copy[key];
            }
          }
          draftsRef.current = copy;
          return copy;
        });

        setFlowDrafts((prev) => {
          if (!(sectionPrefix in prev)) return prev;
          const next = { ...prev };
          delete next[sectionPrefix];
          return next;
        });
      } catch (err) {
        await showAlert(err instanceof Error ? err.message : String(err));
      } finally {
        setLongFormSectionBusy(null);
      }
    },
    [resolveArrayLocales, applyArrayDraft, base.locale],
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
        await showAlert(err instanceof Error ? err.message : String(err));
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

  const getFlowBlocksForEdit = useCallback(
    (sectionKey: string): FlowBlock[] => {
      const section = getSectionFromMessages(sectionKey);
      const prepend = flowPrependRef.current[sectionKey] ?? [];
      const base =
        flowDrafts[sectionKey] ??
        flattenSectionToFlow(section, sectionKey, { prepend });
      return ensurePrependBlocks(base, prepend);
    },
    [flowDrafts, getSectionFromMessages],
  );

  /** mutation 결과를 flowDrafts 에 저장할 때 prepend 부분은 빼서 저장 (SSOT 일관) */
  const saveFlowDraft = useCallback(
    (sectionKey: string, next: FlowBlock[]) => {
      const prepend = flowPrependRef.current[sectionKey] ?? [];
      const draftOnly = stripPrependBlocks(next, prepend);
      setFlowDrafts((prev) => ({ ...prev, [sectionKey]: draftOnly }));
    },
    [],
  );

  const resolveFlowBlocks = useCallback(
    (
      sectionKey: string,
      section: SectionContent,
      options?: { prepend?: FlowBlock[] },
    ): FlowBlock[] => {
      if (options?.prepend?.length) {
        flowPrependRef.current[sectionKey] = options.prepend;
      }
      const raw = getFlowBlocksForEdit(sectionKey);
      return hydrateFlowBlocks(raw, (key) => {
        const direct = drafts[key]?.[base.locale];
        if (typeof direct === "string") return direct;
        const linked = findLinkedDraft(drafts, key);
        const fromLinked = linked?.[base.locale];
        if (typeof fromLinked === "string") return fromLinked;
        return tPath(displayMessages, key);
      });
    },
    [getFlowBlocksForEdit, displayMessages, drafts, base.locale],
  );

  const moveFlowBlock = useCallback(
    async (sectionKey: string, from: number, to: number) => {
      if (from === to) return;
      setFlowBusy(sectionKey);
      try {
        const current = getFlowBlocksForEdit(sectionKey);
        const next = [...current];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        saveFlowDraft(sectionKey, next);
      } finally {
        setFlowBusy(null);
      }
    },
    [getFlowBlocksForEdit, saveFlowDraft],
  );

  const removeFlowBlock = useCallback(
    async (sectionKey: string, index: number) => {
      if (!(await showConfirm({ message: "이 블록을 삭제할까요?", danger: true }))) return;
      setFlowBusy(sectionKey);
      try {
        const current = getFlowBlocksForEdit(sectionKey);
        saveFlowDraft(
          sectionKey,
          current.filter((_, i) => i !== index),
        );
      } finally {
        setFlowBusy(null);
      }
    },
    [getFlowBlocksForEdit, saveFlowDraft],
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
        const current = getFlowBlocksForEdit(sectionKey);
        const block = createFlowBlock(sectionKey, type, options);

        const next = [...current];
        next.splice(index, 0, block);

        const textDraft = draftEntryForNewFlowBlock(block);
        if (
          textDraft &&
          (block.type === "p" ||
            block.type === "heading" ||
            block.type === "sectionTitle" ||
            block.type === "button")
        ) {
          setDraftEntry(block.textKey, textDraft);
        }

        const arrayDraft = arrayDraftForNewFlowBlock(block);
        if (arrayDraft && block.type === "list") {
          applyArrayDraft(`${block.listKey}.items`, arrayDraft);
        }

        saveFlowDraft(sectionKey, next);
      } finally {
        setFlowBusy(null);
      }
    },
    [getFlowBlocksForEdit, saveFlowDraft, setDraftEntry, applyArrayDraft],
  );

  const lookupListBlock = useCallback(
    (listKey: string) => {
      // 1) flow 드래프트에서 먼저 찾기
      const fromDraft = findFlowBlockBySectionAndList(flowDrafts, listKey);
      if (fromDraft) {
        return { sectionKey: fromDraft.sectionKey, block: fromDraft.block };
      }
      // 2) listKey 패턴에서 sectionKey 추출 후 메시지의 section.flow에서 찾기
      const m =
        /^(.+?)\.(?:lists\.\d+|flow\.[a-z0-9]+\.list)$/i.exec(listKey);
      if (!m) return null;
      const sectionKey = m[1];
      const flow = getFlowBlocksForEdit(sectionKey);
      const block = flow.find(
        (b): b is Extract<FlowBlock, { type: "list" }> =>
          b.type === "list" && b.listKey === listKey,
      );
      if (!block) return null;
      return { sectionKey, block };
    },
    [flowDrafts, getFlowBlocksForEdit],
  );

  const updateListBlock = useCallback(
    async (
      listKey: string,
      update: { ordered: boolean; items: string[] },
    ) => {
      const found = lookupListBlock(listKey);
      if (!found) return;
      const { sectionKey } = found;
      setFlowBusy(sectionKey);
      try {
        const current = getFlowBlocksForEdit(sectionKey);
        const next = current.map((b) => {
          if (b.type !== "list" || b.listKey !== listKey) return b;
          return { ...b, ordered: update.ordered, items: [...update.items] };
        });
        saveFlowDraft(sectionKey, next);
      } finally {
        setFlowBusy(null);
      }
    },
    [getFlowBlocksForEdit, saveFlowDraft, lookupListBlock],
  );

  const hideTextKey = useCallback(async (key: string) => {
    if (!(await showConfirm({ message: "이 블록을 삭제할까요?", danger: true }))) return;
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

      if (Object.keys(longFormSectionDrafts).length > 0) {
        await commitLongFormSectionDrafts(longFormSectionDrafts);
      }

      for (const [slug, draft] of Object.entries(centerImageDrafts)) {
        const items: Array<{ id: string; src: string }> = [];
        for (const item of draft.items) {
          if (item.file) {
            const buffer = await item.file.arrayBuffer();
            await writeImageFile(
              `public${item.src}`,
              arrayBufferToBase64(buffer),
              item.file.type,
            );
          }
          items.push({ id: item.id, src: item.src });
        }
        const result = await applyCenterImagesDraft(slug, items);
        setCenterRuntime(slug, result.record);
      }

      const { renamedSlugs } = await commitPendingEdits({
        drafts,
        arrayDrafts,
        stepsDrafts,
        hiddenTextKeys,
        imageDrafts,
        imageDeleteDrafts,
        contactStructureDraft,
        contactStructureBaseline: contactStructureBaseline.current,
        localeManifestDraft,
        localeManifestBaseline: localeManifestBaseline.current,
        pendingLocaleCreates,
        sitePagesHiddenDraft,
        sitePagesHiddenBaseline: sitePagesHiddenBaseline.current,
        therapistDirtySlugs: Object.keys(therapistBlocksDirty),
      });

      if (savedImageKeys.length > 0) {
        setImageCacheBust((prev) => {
          const next = { ...prev };
          const now = Date.now();
          for (const key of savedImageKeys) next[key] = now;
          return next;
        });
      }

      const orderDirty = isSitePagesOrderDirty(
        {
          topOrder: sitePagesTopOrderDraft,
          groupOrder: sitePagesGroupOrderDraft,
        },
        {
          topOrder: sitePagesTopOrderBaseline.current,
          groupOrder: sitePagesGroupOrderBaseline.current,
        },
      );
      if (orderDirty) {
        const top = sitePagesTopOrderDraft ?? sitePagesTopOrderBaseline.current ?? [];
        const groups =
          sitePagesGroupOrderDraft ?? sitePagesGroupOrderBaseline.current ?? {};
        await putSitePagesOrder(top, groups);
        sitePagesTopOrderBaseline.current = [...top];
        sitePagesGroupOrderBaseline.current = { ...groups };
      }

      if (
        isTherapistOrderDirty(
          sitePagesCenterOrderDraft,
          sitePagesCenterOrderBaseline.current,
        )
      ) {
        const order =
          sitePagesCenterOrderDraft ??
          sitePagesCenterOrderBaseline.current ??
          [];
        await patchCentersOrder(order);
        sitePagesCenterOrderBaseline.current = [...order];
      }

      if (
        isTherapistOrderDirty(
          sitePagesTherapistOrderDraft,
          sitePagesTherapistOrderBaseline.current,
        )
      ) {
        const order =
          sitePagesTherapistOrderDraft ??
          sitePagesTherapistOrderBaseline.current ??
          [];
        await patchTherapistsOrder(order);
        sitePagesTherapistOrderBaseline.current = [...order];
      }

      contactStructureBaseline.current =
        contactStructureDraft ?? (await fetchContactFormStructure().catch(() => getContactFormStructure()));
      localeManifestBaseline.current =
        localeManifestDraft ?? (await fetchLocaleManifest().catch(() => getLocaleManifest()));
      if (sitePagesHiddenDraft) {
        sitePagesHiddenBaseline.current = [...sitePagesHiddenDraft];
      }

      if (Object.keys(renamedSlugs).length > 0) {
        const currentPath = window.location.pathname;
        for (const [oldSlug, newSlug] of Object.entries(renamedSlugs)) {
          const oldPath = `/therapists/${oldSlug}`;
          if (currentPath === oldPath || currentPath.startsWith(`${oldPath}/`)) {
            const nextPath = currentPath.replace(oldPath, `/therapists/${newSlug}`);
            window.location.replace(nextPath + window.location.search + window.location.hash);
            return;
          }
        }
        window.location.reload();
        return;
      }

      await base.reloadLocales();
      clearPendingState();
      window.dispatchEvent(new Event("phmh-edit-committed"));
    } catch (err) {
      await showAlert(err instanceof Error ? err.message : String(err));
      throw err;
    } finally {
      setCommitting(false);
    }
  }, [
    drafts,
    arrayDrafts,
    stepsDrafts,
    flowDrafts,
    longFormSectionDrafts,
    hiddenTextKeys,
    imageDrafts,
    centerImageDrafts,
    imageDeleteDrafts,
    contactStructureDraft,
    localeManifestDraft,
    pendingLocaleCreates,
    sitePagesHiddenDraft,
    sitePagesTopOrderDraft,
    sitePagesGroupOrderDraft,
    sitePagesCenterOrderDraft,
    sitePagesTherapistOrderDraft,
    therapistBlocksDirty,
    clearPendingState,
    base,
  ]);

  const openTextEditor = useCallback((key: string) => {
    setSelected({ key, kind: "text" });
  }, []);

  const openImageEditor = useCallback((key: string) => {
    setSelected({ key, kind: "image" });
  }, []);

  const openListEditor = useCallback((listKey: string) => {
    setSelected({ key: listKey, kind: "list" });
  }, []);

  const openContactFieldEditor = useCallback((fieldId: string) => {
    setSelected({ kind: "contactField", fieldId });
  }, []);

  const closeEditor = useCallback(() => {
    setSelected(null);
    setPanelBaseline(null);
    window.dispatchEvent(new Event("phmh-edit-panel-closed"));
  }, []);

  const pendingCtx = useMemo<PendingCheckContext>(
    () => ({
      locale: base.locale,
      committedMessages: base.messages,
      displayMessages,
      drafts,
      imageDrafts,
      centerImageDrafts,
      imageDeleteDrafts,
      hiddenTextKeys,
      arrayDrafts,
      stepsDrafts,
      flowDrafts,
    }),
    [
      base.locale,
      base.messages,
      displayMessages,
      drafts,
      imageDrafts,
      centerImageDrafts,
      imageDeleteDrafts,
      hiddenTextKeys,
      arrayDrafts,
      stepsDrafts,
      flowDrafts,
    ],
  );

  const isEditKeyPending = useCallback(
    (key: string) => checkEditKeyPending(key, pendingCtx),
    [pendingCtx],
  );

  const resolveCommittedTextRegistryValues = useCallback(
    async (key: string): Promise<LocaleTextValues> => {
      if (isGeneratedFlowTextKey(key) && draftsRef.current[key]) {
        return emptyLocaleTextValues();
      }
      const therapistField = parseTherapistFieldKey(key);
      if (therapistField) {
        const record = getTherapistBySlug(therapistField.slug);
        if (!record) return emptyLocaleTextValues();
        return readTherapistFieldLocales(record, therapistField);
      }
      const centerField = parseCenterFieldKey(key);
      if (centerField) {
        const record = getCenterBySlug(centerField.slug);
        if (!record) return emptyLocaleTextValues();
        return readCenterFieldLocales(record, centerField);
      }
      const parsed = parseArrayItemKey(key);
      if (parsed) {
        const arrays = await fetchArrayRegistry(parsed.arrayKey);
        return localeTextFromArrayItem(arrays, parsed.index);
      }
      const stepField = parseStepFieldKey(key);
      if (stepField) {
        const arrays = await fetchStepsRegistry(stepField.arrayKey);
        return localeTextFromStepField(arrays, stepField.index, stepField.field);
      }
      return fetchTextRegistry(key);
    },
    [],
  );

  const resolveTextRegistryValues = useCallback(
    async (key: string): Promise<LocaleTextValues> => {
      const draft = findLinkedDraft(draftsRef.current, key);
      if (draft) return { ...emptyLocaleTextValues(), ...draft };

      const parsed = parseArrayItemKey(key);
      if (parsed) {
        const arrays = await resolveArrayLocales(parsed.arrayKey);
        return localeTextFromArrayItem(arrays, parsed.index);
      }

      const stepField = parseStepFieldKey(key);
      if (stepField) {
        const arrays = await resolveStepsLocales(stepField.arrayKey);
        return localeTextFromStepField(arrays, stepField.index, stepField.field);
      }

      const therapistField = parseTherapistFieldKey(key);
      if (therapistField) {
        const record = getTherapistBySlug(therapistField.slug);
        if (!record) return emptyLocaleTextValues();
        return readTherapistFieldLocales(record, therapistField);
      }
      const centerField = parseCenterFieldKey(key);
      if (centerField) {
        const record = getCenterBySlug(centerField.slug);
        if (!record) return emptyLocaleTextValues();
        return readCenterFieldLocales(record, centerField);
      }

      return fetchTextRegistry(key);
    },
    [resolveArrayLocales, resolveStepsLocales],
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
        } else if (parseStepFieldKey(key)) {
          const stepField = parseStepFieldKey(key)!;
          const current = await resolveStepsLocales(stepField.arrayKey);
          const next = mergeStepFieldIntoLocales(
            current,
            stepField.index,
            stepField.field,
            entry,
          );
          await patchStepsArray(stepField.arrayKey, next);
          applyStepsDraft(stepField.arrayKey, next);
        } else if (parseTherapistFieldKey(key)) {
          const ref = parseTherapistFieldKey(key)!;
          const current = getTherapistBySlug(ref.slug);
          if (!current) return;
          const isNameKey = Boolean(getTherapistLinkedTextKeys(key));
          const updated = isNameKey
            ? applyTherapistNameLocales(current, entry)
            : applyTherapistFieldLocales(current, ref, entry);

          if (isNameKey) {
            const targetSlug = await computeTherapistTargetSlug(ref.slug, updated);
            if (targetSlug !== ref.slug) {
              const result = await renameTherapist(ref.slug, targetSlug, updated);
              renameTherapistRuntime(ref.slug, targetSlug);
              setTherapistRuntime(targetSlug, result.record ?? { ...updated, slug: targetSlug });
              setDrafts((prev) => {
                const next = { ...prev };
                for (const k of getLinkedTextKeys(key)) delete next[k];
                return next;
              });
              if (typeof window !== "undefined") {
                const oldPath = `/therapists/${ref.slug}`;
                const currentPath = window.location.pathname;
                if (
                  currentPath === oldPath ||
                  currentPath.startsWith(`${oldPath}/`)
                ) {
                  const nextPath = currentPath.replace(
                    oldPath,
                    `/therapists/${targetSlug}`,
                  );
                  window.location.replace(
                    nextPath + window.location.search + window.location.hash,
                  );
                  return;
                }
                window.location.reload();
                return;
              }
              return;
            }
          }
          const result = await patchTherapist(ref.slug, updated);
          setTherapistRuntime(ref.slug, result.record ?? updated);
        } else if (parseCenterFieldKey(key)) {
          const ref = parseCenterFieldKey(key)!;
          const current = getCenterBySlug(ref.slug);
          if (!current) return;
          const isTitleKey = Boolean(getCenterLinkedTextKeys(key));
          const updated = isTitleKey
            ? applyCenterTitleLocales(current, entry)
            : applyCenterFieldLocales(current, ref, entry);
          const result = await patchCenter(ref.slug, updated);
          setCenterRuntime(ref.slug, result.record ?? updated);
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
        await showAlert(err instanceof Error ? err.message : String(err));
        throw err;
      } finally {
        setCommitting(false);
      }
    },
    [drafts, resolveArrayLocales, resolveStepsLocales, applyArrayDraft, applyStepsDraft, base],
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
        await showAlert(err instanceof Error ? err.message : String(err));
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
      if (imageDeleteDrafts[key]) {
        return isTherapistPortraitKey(key) ? DEFAULT_PORTRAIT_LIGHT : DEFAULT_HERO_LIGHT;
      }
      const v = imageCacheBust[key];
      if (v) {
        const sep = committedSrc.includes("?") ? "&" : "?";
        return `${committedSrc}${sep}v=${v}`;
      }
      return committedSrc;
    },
    [imageDrafts, imageDeleteDrafts, imageCacheBust],
  );

  const pendingCount =
    countPendingChanges(pendingCtx) +
    pendingLocaleCreates.length +
    (isContactStructureDirty(contactStructureDraft, contactStructureBaseline.current) ? 1 : 0) +
    (isLocaleManifestDirty(localeManifestDraft, localeManifestBaseline.current) ? 1 : 0) +
    (isSitePagesHiddenDirty(sitePagesHiddenDraft, sitePagesHiddenBaseline.current) ? 1 : 0) +
    (isSitePagesOrderDirty(
      { topOrder: sitePagesTopOrderDraft, groupOrder: sitePagesGroupOrderDraft },
      {
        topOrder: sitePagesTopOrderBaseline.current,
        groupOrder: sitePagesGroupOrderBaseline.current,
      },
    )
      ? 1
      : 0) +
    (isTherapistOrderDirty(
      sitePagesCenterOrderDraft,
      sitePagesCenterOrderBaseline.current,
    )
      ? 1
      : 0) +
    (isTherapistOrderDirty(
      sitePagesTherapistOrderDraft,
      sitePagesTherapistOrderBaseline.current,
    )
      ? 1
      : 0) +
    Object.keys(centerImageDrafts).length +
    Object.keys(therapistBlocksDirty).length;

  const draftCtx = useMemo(
    () => ({
      drafts,
      imageDrafts,
      centerImageDrafts,
      pendingCount,
      committing,
      selected,
      openTextEditor,
      openImageEditor,
      openListEditor,
      openContactFieldEditor,
      closeEditor,
      setDraftEntry,
      setImageDraft,
      setCenterImagesDraft,
      getCenterImagesDraft,
      isCenterImagesPending,
      imageDeleteDrafts,
      markImageDelete,
      unmarkImageDelete,
      isImagePendingDelete,
      revertDraft,
      revertArrayDraft,
      revertImageDraft,
      revertAll,
      commitAll,
      commitTextKey,
      resolveTextRegistryValues,
      resolveCommittedTextRegistryValues,
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
      stepsBusy,
      insertStep,
      removeStep,
      moveStep,
      flowBusy,
      resolveFlowBlocks,
      moveFlowBlock,
      removeFlowBlock,
      insertFlowBlock,
      updateListBlock,
      lookupListBlock,
      hideTextKey,
      contactStructureDraft,
      setContactStructureDraft,
      localeManifestDraft,
      applyLocaleManifestDraft,
      createLocaleWithFiles,
      localeCreateBusy,
      applyArrayDraft,
      arrayDrafts,
      applyTherapistArrayPreview,
      removeContactFieldDrafts,
      sitePagesHiddenDraft,
      setSitePagesHiddenDraft,
      sitePagesTopOrderDraft,
      sitePagesGroupOrderDraft,
      sitePagesCenterOrderDraft,
      sitePagesTherapistOrderDraft,
      setSitePagesTopOrderDraft,
      setSitePagesGroupOrderDraft,
      setSitePagesCenterOrderDraft,
      setSitePagesTherapistOrderDraft,
      markTherapistBlocksDirty,
      longFormSectionBusy,
      insertLongFormSection,
      removeLongFormSection,
    }),
    [
      drafts,
      imageDrafts,
      centerImageDrafts,
      pendingCount,
      committing,
      selected,
      openTextEditor,
      openImageEditor,
      openListEditor,
      openContactFieldEditor,
      closeEditor,
      setDraftEntry,
      setImageDraft,
      setCenterImagesDraft,
      getCenterImagesDraft,
      isCenterImagesPending,
      imageDeleteDrafts,
      markImageDelete,
      unmarkImageDelete,
      isImagePendingDelete,
      revertDraft,
      revertArrayDraft,
      revertImageDraft,
      revertAll,
      commitAll,
      commitTextKey,
      resolveTextRegistryValues,
      resolveCommittedTextRegistryValues,
      commitImageKey,
      isEditKeyPending,
      panelBaseline,
      getImagePreviewSrc,
      arrayBusy,
      isTextKeyHidden,
      addArrayItem,
      removeArrayItem,
      moveArrayItem,
      stepsBusy,
      insertStep,
      removeStep,
      moveStep,
      flowBusy,
      resolveFlowBlocks,
      moveFlowBlock,
      removeFlowBlock,
      insertFlowBlock,
      updateListBlock,
      lookupListBlock,
      hideTextKey,
      contactStructureDraft,
      setContactStructureDraft,
      localeManifestDraft,
      applyLocaleManifestDraft,
      createLocaleWithFiles,
      localeCreateBusy,
      applyArrayDraft,
      arrayDrafts,
      applyTherapistArrayPreview,
      removeContactFieldDrafts,
      sitePagesHiddenDraft,
      setSitePagesHiddenDraft,
      sitePagesTopOrderDraft,
      sitePagesGroupOrderDraft,
      sitePagesCenterOrderDraft,
      sitePagesTherapistOrderDraft,
      setSitePagesTopOrderDraft,
      setSitePagesGroupOrderDraft,
      setSitePagesCenterOrderDraft,
      setSitePagesTherapistOrderDraft,
      markTherapistBlocksDirty,
      longFormSectionBusy,
      insertLongFormSection,
      removeLongFormSection,
    ],
  );

  return (
    <EditDraftContext.Provider value={draftCtx}>
      <LocaleContext.Provider value={localeValue}>{children}</LocaleContext.Provider>
    </EditDraftContext.Provider>
  );
}
