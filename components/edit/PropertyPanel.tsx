"use client";

// locale 텍스트 속성 패널 — 초안 미리보기, 저장 시 디스크 반영
import { useCallback, useEffect, useMemo, useState } from "react";
import { useEditDraft } from "@/components/edit/EditDraftProvider";
import { EditSidePanel } from "@/components/edit/EditSidePanel";
import { emptyLocaleTextValues } from "@/lib/edit/locale-helpers";
import type { LocaleTextValues } from "@/lib/edit/client";
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
    panelBaseline,
    setPanelBaseline,
    commitTextKey,
    committing,
    resolveTextRegistryValues,
  } = useEditDraft();

  const key = selected?.kind === "text" ? selected.key : null;
  const rows = useMemo(() => localeRows(), []);
  const [values, setValues] = useState<LocaleTextValues>(() => emptyLocaleTextValues());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    const existing = drafts[key];
    if (existing) {
      const merged = mergeTextValues(existing);
      setValues(merged);
      setPanelBaseline(merged);
      setLoading(false);
      return;
    }

    resolveTextRegistryValues(key)
      .then((locales) => {
        if (cancelled) return;
        const merged = mergeTextValues(locales);
        setValues(merged);
        setPanelBaseline(merged);
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
  }, [key, drafts, resolveTextRegistryValues, setPanelBaseline]);

  const applyPreview = useCallback(
    (next: LocaleTextValues) => {
      if (!key) return;
      setValues(next);
      setDraftEntry(key, next);
    },
    [key, setDraftEntry],
  );

  const handleClose = () => {
    closeEditor();
  };

  const handleApply = async () => {
    if (!key || committing) return;
    setDraftEntry(key, values);
    try {
      await commitTextKey(key);
      closeEditor();
    } catch {
      /* alert in commitTextKey */
    }
  };

  if (!key || selected?.kind !== "text") return null;

  const isDirty = Boolean(key && drafts[key]) || isTextDirty(values, panelBaseline);

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
          <div className="phmh-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain">
            {rows.map(({ id, label }) => (
              <label key={id} className="block">
                <span className="mb-1 block text-sm font-medium text-page-heading">{label}</span>
                <textarea
                  className="input-panel w-full px-3 py-2"
                  rows={id === "en" ? 4 : 3}
                  value={values[id] ?? ""}
                  onChange={(e) => applyPreview({ ...values, [id]: e.target.value })}
                />
              </label>
            ))}
          </div>
        )}

        {error ? <p className="mt-3 shrink-0 text-sm text-red-600">{error}</p> : null}
        <div className="mt-4 flex shrink-0 justify-end gap-2 border-t border-page-body/10 pt-4">
          <button
            type="button"
            onClick={handleClose}
            className="rounded px-4 py-2 text-sm text-page-body hover:bg-page-body/10"
            disabled={committing}
          >
            닫기
          </button>
          <button
            type="button"
            onClick={() => void handleApply()}
            className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            disabled={loading || committing || !isDirty}
          >
            {committing ? "저장 중…" : "적용"}
          </button>
        </div>
      </div>
    </EditSidePanel>
  );
}
