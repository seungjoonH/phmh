"use client";

// Contact 필드 종합 설정 패널 (구조·locale 문구·옵션)
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useEditDraft } from "@/components/edit/EditDraftProvider";
import { EditSidePanel } from "@/components/edit/EditSidePanel";
import { editControlDeleteClass } from "@/components/edit/EditInlineControls";
import {
  fetchArrayRegistry,
  fetchTextRegistry,
  type ContactFormStructurePayload,
  type LocaleTextValues,
} from "@/lib/edit/client";
import {
  getContactField,
  type ContactFieldDefinition,
  type ContactFieldType,
} from "@/lib/contact-form-schema";
import { getContactFormStructure } from "@/lib/contact-form-structure";
import { getActiveLocaleIds, resolveLocaleOption } from "@/lib/site-locales";

const FIELD_TYPES: { value: ContactFieldType; label: string }[] = [
  { value: "text", label: "텍스트" },
  { value: "email", label: "이메일" },
  { value: "tel", label: "전화" },
  { value: "date", label: "날짜" },
  { value: "textarea", label: "여러 줄" },
  { value: "select", label: "선택 (드롭다운)" },
  { value: "checkboxGroup", label: "체크박스 목록" },
  { value: "consent", label: "동의" },
];

function supportsPlaceholder(type: ContactFieldType) {
  return type === "text" || type === "textarea" || type === "date";
}

function supportsOptions(type: ContactFieldType) {
  return type === "select" || type === "checkboxGroup";
}

type FieldCopyState = {
  label: LocaleTextValues;
  placeholder: LocaleTextValues;
  body: LocaleTextValues;
  checkbox: LocaleTextValues;
  options: Record<string, string[]>;
};

function emptyLocaleRecord(): LocaleTextValues {
  return Object.fromEntries(getActiveLocaleIds().map((id) => [id, ""]));
}

export function ContactFieldConfigPanel() {
  const {
    selected,
    closeEditor,
    drafts,
    setDraftEntry,
    applyArrayDraft,
    revertDraft,
    revertArrayDraft,
    contactStructureDraft,
    setContactStructureDraft,
    removeContactFieldDrafts,
  } = useEditDraft();
  const fieldId = selected?.kind === "contactField" ? selected.fieldId : null;
  const structureAtOpenRef = useRef<ContactFormStructurePayload | null>(null);
  const shouldSyncCopyDraftRef = useRef(false);

  const [field, setField] = useState<ContactFieldDefinition | null>(null);
  const [copy, setCopy] = useState<FieldCopyState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const localeRows = useMemo(
    () =>
      getActiveLocaleIds().map((id) => ({
        id,
        label: resolveLocaleOption(id)?.label ?? id.toUpperCase(),
      })),
    [],
  );

  useEffect(() => {
    if (!fieldId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    const load = async () => {
      const structure = contactStructureDraft ?? getContactFormStructure();
      const def = structure.fields.find((f) => f.id === fieldId) ?? getContactField(fieldId);
      if (!def) throw new Error(`Unknown field: ${fieldId}`);

      const labelKey = `contactForm.fields.${fieldId}.label`;
      const placeholderKey = `contactForm.fields.${fieldId}.placeholder`;
      const bodyKey = `contactForm.fields.${fieldId}.body`;
      const checkboxKey = `contactForm.fields.${fieldId}.checkbox`;
      const optionsKey = `contactForm.fields.${fieldId}.options`;

      const label =
        drafts[labelKey] ?? (await fetchTextRegistry(labelKey));
      const placeholder =
        drafts[placeholderKey] ??
        (await fetchTextRegistry(placeholderKey).catch(() => emptyLocaleRecord()));
      const body =
        drafts[bodyKey] ??
        (await fetchTextRegistry(bodyKey).catch(() => emptyLocaleRecord()));
      const checkbox =
        drafts[checkboxKey] ??
        (await fetchTextRegistry(checkboxKey).catch(() => emptyLocaleRecord()));
      const options = await fetchArrayRegistry(optionsKey).catch(() =>
        Object.fromEntries(getActiveLocaleIds().map((id) => [id, []])),
      );

      if (cancelled) return;
      structureAtOpenRef.current = contactStructureDraft
        ? structuredClone(contactStructureDraft)
        : null;
      shouldSyncCopyDraftRef.current = false;
      setField({ ...def } as ContactFieldDefinition);
      setCopy({ label, placeholder, body, checkbox, options });
    };

    load()
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // fieldId 변경 시에만 서버에서 다시 로드 (drafts·structure 갱신마다 로드하면 입력 중 패널이 리셋됨)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 의도적으로 fieldId만 구독
  }, [fieldId]);

  const pushCopyToDrafts = useCallback(
    (state: FieldCopyState, def: ContactFieldDefinition) => {
      if (!fieldId) return;
      const prefix = `contactForm.fields.${fieldId}`;
      setDraftEntry(`${prefix}.label`, state.label);
      if (supportsPlaceholder(def.type)) {
        setDraftEntry(`${prefix}.placeholder`, state.placeholder);
      } else {
        revertDraft(`${prefix}.placeholder`);
      }
      if (def.type === "consent") {
        setDraftEntry(`${prefix}.body`, state.body);
        setDraftEntry(`${prefix}.checkbox`, state.checkbox);
      } else {
        revertDraft(`${prefix}.body`);
        revertDraft(`${prefix}.checkbox`);
      }
      if (supportsOptions(def.type)) {
        applyArrayDraft(`${prefix}.options`, state.options);
      } else {
        revertArrayDraft(`${prefix}.options`);
      }
    },
    [fieldId, setDraftEntry, applyArrayDraft, revertDraft, revertArrayDraft],
  );

  const updateField = useCallback(
    (patch: Partial<ContactFieldDefinition>) => {
      if (!fieldId || !field || !copy) return;
      const next = { ...field, ...patch } as ContactFieldDefinition;
      setField(next);
      const base = contactStructureDraft ?? getContactFormStructure();
      setContactStructureDraft({
        fields: base.fields.map((f) =>
          f.id === fieldId ? ({ ...next, id: fieldId } as ContactFieldDefinition) : f,
        ),
        layout: base.layout,
      });
      pushCopyToDrafts(copy, next);
    },
    [fieldId, field, copy, contactStructureDraft, setContactStructureDraft, pushCopyToDrafts],
  );

  const updateCopy = useCallback(
    (key: keyof Omit<FieldCopyState, "options">, locale: string, value: string) => {
      shouldSyncCopyDraftRef.current = true;
      setCopy((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          [key]: { ...prev[key], [locale]: value },
        };
      });
    },
    [],
  );

  const updateOptions = useCallback(
    (locale: string, options: string[]) => {
      shouldSyncCopyDraftRef.current = true;
      setCopy((prev) => {
        if (!prev) return prev;
        return { ...prev, options: { ...prev.options, [locale]: options } };
      });
    },
    [],
  );

  useEffect(() => {
    if (!shouldSyncCopyDraftRef.current || !copy || !field) return;
    pushCopyToDrafts(copy, field);
  }, [copy, field, pushCopyToDrafts]);

  const handleClose = () => {
    closeEditor();
  };

  const handleCancel = () => {
    if (!fieldId) return;
    removeContactFieldDrafts(fieldId);
    setContactStructureDraft(structureAtOpenRef.current);
    closeEditor();
  };

  if (!fieldId) return null;

  return (
    <EditSidePanel maxWidth="lg">
      <div className="flex min-h-0 flex-1 flex-col p-5">
        <div className="mb-4 flex shrink-0 items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-page-body/70">
              필드 설정
            </p>
            <p className="mt-1 font-mono text-xs text-page-body">{fieldId}</p>
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

        {loading || !field || !copy ? (
          <p className="text-sm text-page-body">불러오는 중…</p>
        ) : (
          <div className="phmh-scrollbar min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain pr-1">
            <section className="space-y-3 rounded-lg border border-page-body/15 p-3">
              <h4 className="text-sm font-semibold text-page-heading">구조</h4>
              <label className="block text-sm">
                <span className="mb-1 block text-page-body">필드 타입</span>
                <select
                  className="input-panel w-full px-2 py-2"
                  value={field.type}
                  onChange={(e) =>
                    updateField({ type: e.target.value as ContactFieldType })
                  }
                >
                  {FIELD_TYPES.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="input-checkbox mt-0"
                  checked={Boolean(field.required)}
                  onChange={(e) => updateField({ required: e.target.checked })}
                />
                필수 입력
              </label>
              {field.type === "textarea" ? (
                <label className="block text-sm">
                  <span className="mb-1 block text-page-body">행 수</span>
                  <input
                    type="number"
                    min={2}
                    max={12}
                    className="input-panel w-24 px-2 py-1"
                    value={field.rows ?? 3}
                    onChange={(e) =>
                      updateField({ rows: Number(e.target.value) || 3 })
                    }
                  />
                </label>
              ) : null}
              <label className="block text-sm">
                <span className="mb-1 block text-page-body">메일 라벨 (영문)</span>
                <input
                  className="input-panel w-full px-2 py-2"
                  value={field.mailLabel}
                  onChange={(e) => updateField({ mailLabel: e.target.value })}
                />
              </label>
            </section>

            {localeRows.map(({ id: loc, label: locLabel }) => (
              <section
                key={loc}
                className="space-y-3 rounded-lg border border-page-body/15 p-3"
              >
                <h4 className="text-sm font-semibold text-page-heading">{locLabel}</h4>
                <label className="block text-sm">
                  <span className="mb-1 block text-page-body">라벨</span>
                  <input
                    className="input-panel w-full px-2 py-2"
                    value={copy.label[loc] ?? ""}
                    onChange={(e) => updateCopy("label", loc, e.target.value)}
                  />
                </label>
                {supportsPlaceholder(field.type) ? (
                  <label className="block text-sm">
                    <span className="mb-1 block text-page-body">Placeholder</span>
                    <input
                      className="input-panel w-full px-2 py-2"
                      value={copy.placeholder[loc] ?? ""}
                      onChange={(e) => updateCopy("placeholder", loc, e.target.value)}
                    />
                  </label>
                ) : null}
                {field.type === "consent" ? (
                  <>
                    <label className="block text-sm">
                      <span className="mb-1 block text-page-body">본문</span>
                      <textarea
                        rows={3}
                        className="input-panel w-full px-2 py-2"
                        value={copy.body[loc] ?? ""}
                        onChange={(e) => updateCopy("body", loc, e.target.value)}
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="mb-1 block text-page-body">체크박스 문구</span>
                      <input
                        className="input-panel w-full px-2 py-2"
                        value={copy.checkbox[loc] ?? ""}
                        onChange={(e) => updateCopy("checkbox", loc, e.target.value)}
                      />
                    </label>
                  </>
                ) : null}
                {supportsOptions(field.type) ? (
                  <OptionsEditor
                    locale={loc}
                    options={copy.options[loc] ?? []}
                    onChange={(opts) => updateOptions(loc, opts)}
                  />
                ) : null}
              </section>
            ))}
          </div>
        )}

        {error ? <p className="mt-3 shrink-0 text-sm text-red-600">{error}</p> : null}

        <div className="mt-4 shrink-0 border-t border-page-body/10 pt-4">
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="rounded px-4 py-2 text-sm text-page-body hover:bg-page-body/10"
              disabled={loading}
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="rounded px-4 py-2 text-sm text-page-body hover:bg-page-body/10"
              disabled={loading}
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </EditSidePanel>
  );
}

function OptionsEditor({
  locale,
  options,
  onChange,
}: {
  locale: string;
  options: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <div className="text-sm">
      <span className="mb-2 block font-medium text-page-body">옵션 목록</span>
      <ul className="space-y-2">
        {options.map((opt, index) => (
          <li key={`${locale}-${index}`} className="group relative flex gap-2">
            <input
              className="input-panel min-w-0 flex-1 px-2 py-1"
              value={opt}
              onChange={(e) => {
                const next = [...options];
                next[index] = e.target.value;
                onChange(next);
              }}
            />
            <button
              type="button"
              className={`shrink-0 ${editControlDeleteClass}`}
              onClick={() => onChange(options.filter((_, i) => i !== index))}
              aria-label="옵션 삭제"
            >
              삭제
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="mt-2 text-sm text-primary hover:underline"
        onClick={() => onChange([...options, ""])}
      >
        + 옵션 추가
      </button>
    </div>
  );
}
