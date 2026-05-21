"use client";

// locale 텍스트 속성 패널 — 초안 미리보기, 저장 시 디스크 반영
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useEditDraft } from "@/components/edit/EditDraftProvider";
import { EditSidePanel } from "@/components/edit/EditSidePanel";
import { emptyLocaleTextValues } from "@/lib/edit/locale-helpers";
import type { LocaleTextValues } from "@/lib/edit/client";
import { toggleInlineMarkup } from "@/lib/edit/inline-markup-edit";
import {
  createTextEditHistory,
  pushTextEditHistory,
  redoTextEditHistory,
  resetTextEditHistory,
  undoTextEditHistory,
} from "@/lib/edit/text-edit-history";
import { getActiveLocaleIds, resolveLocaleOption } from "@/lib/site-locales";

function localeRows(): { id: string; label: string }[] {
  return getActiveLocaleIds().map((id) => ({
    id,
    label: resolveLocaleOption(id)?.label ?? id.toUpperCase(),
  }));
}

function mergeTextValues(base: LocaleTextValues): LocaleTextValues {
  const empty = emptyLocaleTextValues();
  return { ...empty, ...base };
}

function isTextDirty(a: LocaleTextValues, b: LocaleTextValues | null): boolean {
  if (!b) return true;
  return getActiveLocaleIds().some((id) => a[id] !== b[id]);
}

export function PropertyPanel() {
  const {
    selected,
    closeEditor,
    drafts,
    setDraftEntry,
    revertDraft,
    panelBaseline,
    setPanelBaseline,
    committing,
    resolveCommittedTextRegistryValues,
  } = useEditDraft();

  const key = selected?.kind === "text" ? selected.key : null;
  const rows = useMemo(() => localeRows(), []);
  const [values, setValues] = useState<LocaleTextValues>(() => emptyLocaleTextValues());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const focusedLocaleRef = useRef<string | null>(null);
  const valuesRef = useRef(values);
  const historyRef = useRef(createTextEditHistory());
  const draftsRef = useRef(drafts);
  draftsRef.current = drafts;

  valuesRef.current = values;

  const syncDraft = useCallback(
    (next: LocaleTextValues) => {
      if (!key) return;
      if (!isTextDirty(next, panelBaseline)) {
        revertDraft(key);
      } else {
        setDraftEntry(key, next);
      }
    },
    [key, panelBaseline, revertDraft, setDraftEntry],
  );

  const applyValues = useCallback(
    (next: LocaleTextValues, options?: { recordHistory?: boolean }) => {
      if (!key) return;
      if (options?.recordHistory !== false) {
        pushTextEditHistory(historyRef.current, valuesRef.current);
      }
      setValues(next);
      syncDraft(next);
    },
    [key, syncDraft],
  );

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    resetTextEditHistory(historyRef.current);

    resolveCommittedTextRegistryValues(key)
      .then((committed) => {
        if (cancelled) return;
        const baseline = mergeTextValues(committed);
        setPanelBaseline(baseline);
        const existing = draftsRef.current[key];
        setValues(existing ? mergeTextValues(existing) : baseline);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [key, resolveCommittedTextRegistryValues, setPanelBaseline]);

  const refocusTextarea = useCallback(() => {
    requestAnimationFrame(() => {
      const id = focusedLocaleRef.current;
      if (!id) return;
      const node = textareaRefs.current[id];
      if (!node) return;
      node.focus();
      const end = node.value.length;
      node.setSelectionRange(end, end);
    });
  }, []);

  const handleUndo = useCallback(() => {
    const prev = undoTextEditHistory(historyRef.current, valuesRef.current);
    if (prev) {
      applyValues(prev, { recordHistory: false });
      refocusTextarea();
    }
  }, [applyValues, refocusTextarea]);

  const handleRedo = useCallback(() => {
    const next = redoTextEditHistory(historyRef.current, valuesRef.current);
    if (next) {
      applyValues(next, { recordHistory: false });
      refocusTextarea();
    }
  }, [applyValues, refocusTextarea]);

  const handleMarkupShortcut = useCallback(
    (
      localeId: string,
      wrap: "bold" | "italic",
      e: React.KeyboardEvent<HTMLTextAreaElement>,
    ) => {
      const el = e.currentTarget;
      const current = valuesRef.current[localeId] ?? "";
      const result = toggleInlineMarkup(
        current,
        el.selectionStart,
        el.selectionEnd,
        wrap,
      );
      e.preventDefault();
      applyValues({ ...valuesRef.current, [localeId]: result.text });
      requestAnimationFrame(() => {
        const node = textareaRefs.current[localeId];
        if (!node) return;
        node.focus();
        node.setSelectionRange(result.selectionStart, result.selectionEnd);
      });
    },
    [applyValues],
  );

  const handleKeyDown = useCallback(
    (localeId: string, e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.metaKey && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
        return;
      }
      if (!e.metaKey) return;
      if (e.key === "b") handleMarkupShortcut(localeId, "bold", e);
      if (e.key === "i") handleMarkupShortcut(localeId, "italic", e);
    },
    [handleRedo, handleUndo, handleMarkupShortcut],
  );

  const handleClose = () => {
    closeEditor();
  };

  const handleCancel = () => {
    if (!key) return;
    if (panelBaseline) {
      setValues(panelBaseline);
      revertDraft(key);
    }
    closeEditor();
  };

  if (!key || selected?.kind !== "text") return null;

  const isDirty = isTextDirty(values, panelBaseline);

  return (
    <EditSidePanel>
      <div className="flex min-h-0 flex-1 flex-col p-5">
        <div className="mb-3 flex shrink-0 items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-page-body/70">
              텍스트 편집
            </p>
            <p className="mt-1 break-all font-mono text-xs text-page-body">{key}</p>
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
          <>
            <div className="phmh-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain">
              {rows.map(({ id, label }) => (
                <label key={id} className="block">
                  <span className="mb-1 block text-sm font-medium text-page-heading">{label}</span>
                  <textarea
                    ref={(node) => {
                      textareaRefs.current[id] = node;
                    }}
                    className="input-panel w-full px-3 py-2"
                    rows={id === "en" ? 4 : 3}
                    value={values[id] ?? ""}
                    onFocus={() => {
                      focusedLocaleRef.current = id;
                    }}
                    onChange={(e) =>
                      applyValues({ ...valuesRef.current, [id]: e.target.value })
                    }
                    onKeyDown={(e) => handleKeyDown(id, e)}
                  />
                </label>
              ))}
            </div>
          </>
        )}

        {error ? <p className="mt-3 shrink-0 text-sm text-red-600">{error}</p> : null}
        <div className="mt-4 flex shrink-0 justify-end gap-2 border-t border-page-body/10 pt-4">
          <button
            type="button"
            onClick={handleCancel}
            className="rounded px-4 py-2 text-sm text-page-body hover:bg-page-body/10"
            disabled={committing || loading}
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
