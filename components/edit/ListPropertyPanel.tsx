"use client";

// 목록(ul/ol) 통합 편집 패널 — textarea 한 줄에 -/숫자. 프리픽스로 파싱
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useEditDraft } from "@/components/edit/EditDraftProvider";
import { EditSidePanel } from "@/components/edit/EditSidePanel";
import { fetchArrayRegistry } from "@/lib/edit/client";
import {
  formatListText,
  parseListText,
  type ParseListResult,
} from "@/lib/edit/list-parse";
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
    applyTherapistArrayPreview,
    arrayDrafts,
    revertArrayDraft,
    updateListBlock,
    lookupListBlock,
    committing,
  } = useEditDraft();

  const arrayDraftsRef = useRef(arrayDrafts);
  arrayDraftsRef.current = arrayDrafts;

  // 미리보기 콜백들은 부모 state(flowDrafts 등)에 의존해 매 렌더마다 reference가
  // 바뀐다. useEffect deps에 직접 넣으면 무한 루프가 되므로 ref로 latest만 잡는다.
  const previewCallbacksRef = useRef({
    applyArrayDraft,
    applyTherapistArrayPreview,
    updateListBlock,
  });
  previewCallbacksRef.current = {
    applyArrayDraft,
    applyTherapistArrayPreview,
    updateListBlock,
  };

  const listKey = selected?.kind === "list" ? selected.key : null;
  const therapistArray = useMemo(
    () => (listKey ? parseTherapistArrayKey(listKey) : null),
    [listKey],
  );
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
  const hydratedRef = useRef<string | null>(null);
  // 사용자가 textarea를 실제로 건드린 적이 있는지. hydration setTexts만으로는
  // arrayDrafts에 push하지 않아야 pending(노란점) 오인이 안 생긴다.
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
        let locales: Record<string, string[]>;
        const pendingDraft = arrayDraftsRef.current[
          therapistArray ? listKey : `${listKey}.items`
        ];
        if (pendingDraft) {
          locales = Object.fromEntries(
            localeIds.map((id) => [id, [...(pendingDraft[id] ?? [])]]),
          );
        } else if (therapistArray) {
          const record = getTherapistBySlug(therapistArray.slug);
          if (!record) throw new Error("상담사 데이터를 찾을 수 없습니다.");
          locales = readTherapistArrayLocales(record, therapistArray);
        } else {
          locales = await fetchArrayRegistry(`${listKey}.items`);
        }
        if (cancelled) return;
        const next: Record<string, string> = {};
        for (const id of localeIds) {
          next[id] = formatListText(locales[id] ?? [], initialOrdered);
        }
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

  const parsed = useMemo<Record<string, ParseListResult>>(() => {
    const out: Record<string, ParseListResult> = {};
    for (const id of Object.keys(texts)) {
      out[id] = parseListText(texts[id] ?? "");
    }
    return out;
  }, [texts]);

  const validationError = useMemo<string | null>(() => {
    const ids = Object.keys(parsed);
    let agreedOrdered: boolean | null = null;
    for (const id of ids) {
      const r = parsed[id];
      if (!r.ok) {
        const label = resolveLocaleOption(id)?.label ?? id.toUpperCase();
        return `[${label}] ${r.error}`;
      }
      if (r.items.length === 0) continue;
      if (agreedOrdered === null) agreedOrdered = r.ordered;
      else if (agreedOrdered !== r.ordered) {
        return "언어별 목록 형식이 달라요. 모든 언어에서 ‘-’ 또는 ‘1.’ 중 한 가지만 사용해 주세요.";
      }
    }
    return null;
  }, [parsed]);

  // 실시간 미리보기 — 사용자가 textarea를 건드린 뒤에만 push.
  // hydration 직후의 setTexts가 트리거하는 첫 실행에서는 push하지 않아야
  // 데이터 유실/잘못된 pending 표시를 모두 막을 수 있다.
  useEffect(() => {
    if (!listKey) return;
    if (hydratedRef.current !== listKey) return;
    if (!userEditedRef.current) return;
    if (validationError) return;

    const localesArrays: Record<string, string[]> = {};
    let ordered = initialOrdered;
    for (const id of localeIds) {
      const r = parsed[id];
      localesArrays[id] = r && r.ok ? r.items : [];
      if (r?.ok && r.items.length > 0) ordered = r.ordered;
    }

    const cb = previewCallbacksRef.current;
    if (isTherapistArrayKey(listKey)) {
      cb.applyTherapistArrayPreview(listKey, localesArrays, ordered);
    } else {
      cb.applyArrayDraft(`${listKey}.items`, localesArrays);
      void cb.updateListBlock(listKey, {
        ordered,
        items: localesArrays[localeIds[0]] ?? [],
      });
    }
  }, [listKey, parsed, validationError, initialOrdered, localeIds]);

  const handleClose = useCallback(() => {
    closeEditor();
  }, [closeEditor]);

  const handleCancel = useCallback(async () => {
    if (!listKey) return;
    const arrayKey = therapistArray ? listKey : `${listKey}.items`;
    revertArrayDraft(arrayKey);

    if (therapistArray) {
      const record = getTherapistBySlug(therapistArray.slug);
      if (record) setTherapistRuntime(therapistArray.slug, record);
    } else {
      try {
        const locales = await fetchArrayRegistry(`${listKey}.items`);
        const found = lookupListBlock(listKey);
        if (found) {
          await updateListBlock(listKey, {
            ordered: found.block.ordered ?? false,
            items: locales[localeIds[0]] ?? [],
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
                  rows={8}
                  value={texts[id] ?? ""}
                  onChange={(e) => {
                    userEditedRef.current = true;
                    setTexts((prev) => ({ ...prev, [id]: e.target.value }));
                  }}
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
