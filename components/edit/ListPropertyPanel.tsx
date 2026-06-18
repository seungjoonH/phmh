"use client";

// 목록(ul/ol) 통합 편집 패널 — 중첩 목록 textarea 파싱·자동 포맷
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useEditDraft } from "@/components/edit/EditDraftProvider";
import { EditSidePanel } from "@/components/edit/EditSidePanel";
import { fetchListTreeRegistry } from "@/lib/edit/client";
import { toggleInlineMarkup } from "@/lib/edit/inline-markup-edit";
import { indentTextareaLines, outdentTextareaLines } from "@/lib/edit/list-textarea-indent";
import {
  formatListText,
  parseListText,
  type ParseListResult,
} from "@/lib/edit/list-parse";
import {
  formatListTreeText,
  normalizeListTree,
  parseListTreeText,
  type ParseListTreeResult,
} from "@/lib/edit/list-tree";
import {
  isTherapistArrayKey,
  parseTherapistArrayKey,
  readTherapistArrayLocales,
} from "@/lib/edit/therapist-edit-key";
import { getTherapistBySlug } from "@/lib/therapists/load";
import { setTherapistRuntime } from "@/lib/therapists/runtime";
import { getActiveLocaleIds, resolveLocaleOption } from "@/lib/site-locales";

type LocaleRow = { id: string; label: string };

function localeRows(ids: string[]): LocaleRow[] {
  return ids.map((id) => ({
    id,
    label: resolveLocaleOption(id)?.label ?? id.toUpperCase(),
  }));
}

export function ListPropertyPanel() {
  const {
    selected,
    closeEditor,
    applyArrayDraft,
    applyListTreeDraft,
    applyTherapistArrayPreview,
    arrayDrafts,
    listTreeDrafts,
    revertArrayDraft,
    revertListTreeDraft,
    updateListBlock,
    lookupListBlock,
    committing,
  } = useEditDraft();

  const arrayDraftsRef = useRef(arrayDrafts);
  arrayDraftsRef.current = arrayDrafts;
  const listTreeDraftsRef = useRef(listTreeDrafts);
  listTreeDraftsRef.current = listTreeDrafts;

  const previewCallbacksRef = useRef({
    applyArrayDraft,
    applyListTreeDraft,
    applyTherapistArrayPreview,
    updateListBlock,
  });
  previewCallbacksRef.current = {
    applyArrayDraft,
    applyListTreeDraft,
    applyTherapistArrayPreview,
    updateListBlock,
  };

  const listKey = selected?.kind === "list" ? selected.key : null;
  const therapistArray = useMemo(
    () => (listKey ? parseTherapistArrayKey(listKey) : null),
    [listKey],
  );
  const isFlowList = Boolean(listKey && !therapistArray);
  const localeIds = useMemo(() => getActiveLocaleIds(), []);
  const rows = useMemo(() => localeRows(localeIds), [localeIds]);
  const lookup = useMemo(
    () => (listKey ? lookupListBlock(listKey) : null),
    [listKey, lookupListBlock],
  );

  const initialOrdered = useMemo(() => {
    if (lookup?.block) return lookup.block.ordered ?? false;
    if (!therapistArray || therapistArray.field !== "profile.blocks.items") return false;
    const record = getTherapistBySlug(therapistArray.slug);
    const block = record?.profile.blocks.find((b) => b.id === therapistArray.blockId);
    return block?.type === "list" ? block.ordered ?? false : false;
  }, [lookup, therapistArray]);

  const [texts, setTexts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const textsRef = useRef(texts);
  textsRef.current = texts;
  const hydratedRef = useRef<string | null>(null);
  const userEditedRef = useRef(false);

  useEffect(() => {
    if (!listKey) return;
    if (hydratedRef.current === listKey) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    userEditedRef.current = false;

    const load = async () => {
      try {
        const next: Record<string, string> = {};
        if (therapistArray) {
          const pendingDraft = arrayDraftsRef.current[listKey];
          let locales: Record<string, string[]>;
          if (pendingDraft) {
            locales = Object.fromEntries(
              localeIds.map((id) => [id, [...(pendingDraft[id] ?? [])]]),
            );
          } else {
            const record = getTherapistBySlug(therapistArray.slug);
            if (!record) throw new Error("상담사 데이터를 찾을 수 없습니다.");
            locales = readTherapistArrayLocales(record, therapistArray);
          }
          for (const id of localeIds) {
            next[id] = formatListText(locales[id] ?? [], initialOrdered);
          }
        } else {
          const itemsKey = `${listKey}.items`;
          const pendingDraft = listTreeDraftsRef.current[itemsKey];
          let locales: Record<string, unknown[]>;
          if (pendingDraft) {
            locales = Object.fromEntries(
              localeIds.map((id) => [id, [...(pendingDraft[id] ?? [])]]),
            );
          } else {
            locales = await fetchListTreeRegistry(itemsKey);
          }
          const defaultMarker = initialOrdered ? "decimal-dot" : "dash";
          for (const id of localeIds) {
            const tree = normalizeListTree(locales[id], defaultMarker);
            next[id] = formatListTreeText(tree);
          }
        }
        if (cancelled) return;
        setTexts(next);
        hydratedRef.current = listKey;
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [listKey, initialOrdered, therapistArray, localeIds]);

  useEffect(() => {
    return () => {
      hydratedRef.current = null;
    };
  }, []);

  const parsedFlat = useMemo<Record<string, ParseListResult>>(() => {
    const out: Record<string, ParseListResult> = {};
    if (isFlowList) return out;
    for (const id of Object.keys(texts)) {
      out[id] = parseListText(texts[id] ?? "");
    }
    return out;
  }, [texts, isFlowList]);

  const parsedTree = useMemo<Record<string, ParseListTreeResult>>(() => {
    const out: Record<string, ParseListTreeResult> = {};
    if (!isFlowList) return out;
    for (const id of Object.keys(texts)) {
      out[id] = parseListTreeText(texts[id] ?? "");
    }
    return out;
  }, [texts, isFlowList]);

  const validationError = useMemo<string | null>(() => {
    if (isFlowList) {
      for (const id of localeIds) {
        const r = parsedTree[id];
        if (!r?.ok) {
          const label = resolveLocaleOption(id)?.label ?? id.toUpperCase();
          return `[${label}] ${r?.ok === false ? r.error : "형식 오류"}`;
        }
      }
      return null;
    }

    let agreedOrdered: boolean | null = null;
    for (const id of localeIds) {
      const r = parsedFlat[id];
      if (!r?.ok) {
        const label = resolveLocaleOption(id)?.label ?? id.toUpperCase();
        return `[${label}] ${r?.ok === false ? r.error : "형식 오류"}`;
      }
      if (r.items.length === 0) continue;
      if (agreedOrdered === null) agreedOrdered = r.ordered;
      else if (agreedOrdered !== r.ordered) {
        return "언어별 목록 형식이 달라요. 모든 언어에서 ‘-’ 또는 ‘1.’ 중 한 가지만 사용해 주세요.";
      }
    }
    return null;
  }, [isFlowList, localeIds, parsedFlat, parsedTree]);

  useEffect(() => {
    if (!listKey) return;
    if (hydratedRef.current !== listKey) return;
    if (!userEditedRef.current) return;
    if (validationError) return;

    const cb = previewCallbacksRef.current;
    if (isTherapistArrayKey(listKey)) {
      const localesArrays: Record<string, string[]> = {};
      let ordered = initialOrdered;
      for (const id of localeIds) {
        const r = parsedFlat[id];
        localesArrays[id] = r && r.ok ? r.items : [];
        if (r?.ok && r.items.length > 0) ordered = r.ordered;
      }
      cb.applyTherapistArrayPreview(listKey, localesArrays, ordered);
      return;
    }

    const treeLocales: Record<string, ReturnType<typeof normalizeListTree>> = {};
    let ordered = initialOrdered;
    for (const id of localeIds) {
      const r = parsedTree[id];
      treeLocales[id] = r && r.ok ? r.tree : [];
      if (r?.ok && r.tree.length > 0) ordered = r.rootOrdered;
    }
    cb.applyListTreeDraft(`${listKey}.items`, treeLocales);
    void cb.updateListBlock(listKey, {
      ordered,
      items: treeLocales[localeIds[0]] ?? [],
    });
  }, [
    listKey,
    parsedFlat,
    parsedTree,
    validationError,
    initialOrdered,
    localeIds,
    isFlowList,
  ]);

  const handleMarkupShortcut = useCallback(
    (
      localeId: string,
      wrap: "bold" | "italic",
      e: React.KeyboardEvent<HTMLTextAreaElement>,
    ) => {
      const el = e.currentTarget;
      const current = textsRef.current[localeId] ?? "";
      const result = toggleInlineMarkup(
        current,
        el.selectionStart,
        el.selectionEnd,
        wrap,
      );
      e.preventDefault();
      userEditedRef.current = true;
      setTexts((prev) => ({ ...prev, [localeId]: result.text }));
      requestAnimationFrame(() => {
        const node = textareaRefs.current[localeId];
        if (!node) return;
        node.focus();
        node.setSelectionRange(result.selectionStart, result.selectionEnd);
      });
    },
    [],
  );

  const handleTabIndent = useCallback(
    (localeId: string, e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const el = e.currentTarget;
      const current = textsRef.current[localeId] ?? "";
      const result = indentTextareaLines(
        current,
        el.selectionStart,
        el.selectionEnd,
      );
      e.preventDefault();
      userEditedRef.current = true;
      setTexts((prev) => ({ ...prev, [localeId]: result.text }));
      requestAnimationFrame(() => {
        const node = textareaRefs.current[localeId];
        if (!node) return;
        node.focus();
        node.setSelectionRange(result.selectionStart, result.selectionEnd);
      });
    },
    [],
  );

  const handleTabOutdent = useCallback(
    (localeId: string, e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const el = e.currentTarget;
      const current = textsRef.current[localeId] ?? "";
      const result = outdentTextareaLines(
        current,
        el.selectionStart,
        el.selectionEnd,
      );
      e.preventDefault();
      userEditedRef.current = true;
      setTexts((prev) => ({ ...prev, [localeId]: result.text }));
      requestAnimationFrame(() => {
        const node = textareaRefs.current[localeId];
        if (!node) return;
        node.focus();
        node.setSelectionRange(result.selectionStart, result.selectionEnd);
      });
    },
    [],
  );

  const handleKeyDown = useCallback(
    (localeId: string, e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Tab" && !e.metaKey && !e.altKey && !e.ctrlKey) {
        if (e.shiftKey) handleTabOutdent(localeId, e);
        else handleTabIndent(localeId, e);
        return;
      }
      if (!e.metaKey) return;
      if (e.key === "b") handleMarkupShortcut(localeId, "bold", e);
      if (e.key === "i") handleMarkupShortcut(localeId, "italic", e);
    },
    [handleMarkupShortcut, handleTabIndent, handleTabOutdent],
  );

  const handleAutoFormat = useCallback(() => {
    userEditedRef.current = true;
    setTexts((prev) => {
      const next = { ...prev };
      for (const id of localeIds) {
        if (isFlowList) {
          const r = parseListTreeText(prev[id] ?? "");
          if (r.ok) next[id] = formatListTreeText(r.tree);
        } else {
          const r = parseListText(prev[id] ?? "");
          if (r.ok) next[id] = formatListText(r.items, r.ordered);
        }
      }
      return next;
    });
  }, [isFlowList, localeIds]);

  const handleClose = useCallback(() => {
    closeEditor();
  }, [closeEditor]);

  const handleCancel = useCallback(async () => {
    if (!listKey) return;
    if (therapistArray) {
      revertArrayDraft(listKey);
      const record = getTherapistBySlug(therapistArray.slug);
      if (record) setTherapistRuntime(therapistArray.slug, record);
    } else {
      const itemsKey = `${listKey}.items`;
      revertListTreeDraft(itemsKey);
      try {
        const locales = await fetchListTreeRegistry(itemsKey);
        const found = lookupListBlock(listKey);
        if (found) {
          const defaultMarker = found.block.ordered ? "decimal-dot" : "dash";
          await updateListBlock(listKey, {
            ordered: found.block.ordered ?? false,
            items: normalizeListTree(locales[localeIds[0]], defaultMarker),
          });
        }
      } catch {
        /* ignore */
      }
    }
    closeEditor();
  }, [
    listKey,
    therapistArray,
    revertArrayDraft,
    revertListTreeDraft,
    lookupListBlock,
    updateListBlock,
    localeIds,
    closeEditor,
  ]);

  if (!listKey || selected?.kind !== "list") return null;

  return (
    <EditSidePanel>
      <div className="flex min-h-0 flex-1 flex-col p-5">
        <div className="mb-3 flex shrink-0 items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-page-body/70">
              목록 편집
            </p>
            <p className="mt-1 break-all font-mono text-xs text-page-body">{listKey}</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded p-1 text-page-body hover:bg-page-body/10"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-page-body">불러오는 중…</p>
        ) : (
          <div className="phmh-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain">
            {rows.map(({ id, label }) => (
              <label key={id} className="block">
                <span className="mb-1 block text-sm font-medium text-page-heading">
                  {label}
                </span>
                <textarea
                  ref={(node) => {
                    textareaRefs.current[id] = node;
                  }}
                  className="input-panel w-full px-3 py-2 font-mono"
                  rows={12}
                  style={{ tabSize: 2 }}
                  value={texts[id] ?? ""}
                  onChange={(e) => {
                    userEditedRef.current = true;
                    setTexts((prev) => ({ ...prev, [id]: e.target.value }));
                  }}
                  onKeyDown={(e) => handleKeyDown(id, e)}
                />
              </label>
            ))}
          </div>
        )}

        {error ? <p className="mt-3 shrink-0 text-sm text-red-600">{error}</p> : null}
        {validationError ? (
          <p className="mt-3 shrink-0 text-sm text-red-600">{validationError}</p>
        ) : null}
        <div className="mt-4 flex shrink-0 justify-end gap-2 border-t border-page-body/10 pt-4">
          <button
            type="button"
            onClick={handleAutoFormat}
            className="mr-auto rounded px-4 py-2 text-sm text-page-body hover:bg-page-body/10"
            disabled={loading || committing}
          >
            자동 포맷
          </button>
          <button
            type="button"
            onClick={() => void handleCancel()}
            className="rounded px-4 py-2 text-sm text-page-body hover:bg-page-body/10"
            disabled={loading || committing}
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="rounded px-4 py-2 text-sm text-page-body hover:bg-page-body/10"
            disabled={committing}
          >
            닫기
          </button>
        </div>
      </div>
    </EditSidePanel>
  );
}
