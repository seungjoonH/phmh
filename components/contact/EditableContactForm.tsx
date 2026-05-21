"use client";

// 편집 모드 Contact 폼 — 본문과 동일한 UI, 변경은 툴바「저장」까지 미리보기만
import { Fragment, useCallback, useMemo } from "react";
import { useDebouncedHoverIndex } from "@/components/edit/useDebouncedHoverIndex";
import { ContactFieldRenderer } from "@/components/contact/ContactFieldRenderer";
import { EditAddPill } from "@/components/edit/EditAddPill";
import { EditInlineControls } from "@/components/edit/EditInlineControls";
import { EditReorderList } from "@/components/edit/EditReorderList";
import { EditReorderRow } from "@/components/edit/EditReorderRow";
import { useEditReorderDrag } from "@/components/edit/useEditReorderDrag";
import { useEditDraft } from "@/components/edit/EditDraftProvider";
import type { ContactFormStructurePayload } from "@/lib/edit/client";
import {
  getContactField,
  type ContactFormLocaleKey,
  type ContactLayoutItem,
} from "@/lib/contact-form-schema";
import { getContactFormStructure } from "@/lib/contact-form-structure";
import { getActiveLocaleIds } from "@/lib/site-locales";
import { emptyLocaleTextValues } from "@/lib/edit/locale-helpers";
import { confirm as showConfirm } from "@/components/ui/AppDialog";

type Props = {
  locale: ContactFormLocaleKey;
  onStructureChange?: () => void;
};

// row 안 필드 구성이 바뀌어도 첫 필드 id가 같으면 React가 재마운트하지 않도록
// 첫 fieldId를 키 식별자로 사용 (없으면 인덱스 fallback)
function layoutItemKey(item: ContactLayoutItem, index: number): string {
  if (item.type === "row") {
    const first = item.fields[0] ?? `empty-${index}`;
    return `row:${first}`;
  }
  return `field:${item.fieldId}`;
}

function generateFieldId(): string {
  // crypto.randomUUID는 dash 포함 36자 — 앞 8자만 사용
  const rand =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `field_${rand}`;
}

function defaultNewField(id: string): ContactFormStructurePayload["fields"][number] {
  return {
    id,
    type: "text",
    required: false,
    mailLabel: id,
    mail: { kind: "inline" },
  };
}

export function EditableContactForm({ locale, onStructureChange }: Props) {
  const {
    openContactFieldEditor,
    closeEditor,
    selected,
    contactStructureDraft,
    setContactStructureDraft,
    setDraftEntry,
    applyArrayDraft,
    removeContactFieldDrafts,
    committing,
  } = useEditDraft();

  const structure = useMemo(
    () => contactStructureDraft ?? getContactFormStructure(),
    [contactStructureDraft],
  );

  const {
    dragIndex,
    dropTarget,
    beginDrag,
    createDropHandler,
    getRowShift,
  } = useEditReorderDrag();

  const busy = committing;

  // 드래그 중에는 hover 가 발동하지 않도록 disabled.
  const { hoveredIndex, scheduleEnter, scheduleLeave } = useDebouncedHoverIndex(
    { inDelayMs: 80, outDelayMs: 260, disabled: dragIndex !== null },
  );

  // bar i 는 row(i-1)의 아래 / row(i)의 위. hover row 인접 시 노출.
  const isBarVisible = (i: number): boolean => {
    if (hoveredIndex === null) return false;
    return hoveredIndex === i - 1 || hoveredIndex === i;
  };

  const applyStructure = useCallback(
    (next: ContactFormStructurePayload) => {
      setContactStructureDraft(next);
      onStructureChange?.();
    },
    [setContactStructureDraft, onStructureChange],
  );

  const seedFieldCopyDrafts = useCallback(
    (fieldId: string) => {
      const label = Object.fromEntries(getActiveLocaleIds().map((id) => [id, fieldId]));
      setDraftEntry(`contactForm.fields.${fieldId}.label`, label);
      for (const key of ["placeholder", "body", "checkbox"] as const) {
        setDraftEntry(`contactForm.fields.${fieldId}.${key}`, emptyLocaleTextValues());
      }
      const options = Object.fromEntries(getActiveLocaleIds().map((id) => [id, ["Option 1"]]));
      applyArrayDraft(`contactForm.fields.${fieldId}.options`, options);
    },
    [setDraftEntry, applyArrayDraft],
  );

  createDropHandler((from, insertAt) => {
    const layout = [...structure.layout];
    const [moved] = layout.splice(from, 1);
    layout.splice(insertAt, 0, moved);
    applyStructure({ ...structure, layout });
  });

  const handleAddFieldAt = (insertAt: number) => {
    const id = generateFieldId();
    const field = defaultNewField(id);
    const layout = [...structure.layout];
    const safeIndex = Math.max(0, Math.min(insertAt, layout.length));
    layout.splice(safeIndex, 0, { type: "field", fieldId: id });
    applyStructure({
      fields: [...structure.fields, field],
      layout,
    });
    seedFieldCopyDrafts(id);
    openContactFieldEditor(id);
  };

  const handleDelete = async (fieldId: string) => {
    if (
      !(await showConfirm({
        message: "이 필드를 삭제할까요? 저장 시 locale 문구도 함께 제거됩니다.",
        danger: true,
      }))
    )
      return;
    const fields = structure.fields.filter((f) => f.id !== fieldId);
    const layout: ContactLayoutItem[] = [];
    for (const item of structure.layout) {
      if (item.type === "row") {
        const rowFields = item.fields.filter((id) => id !== fieldId);
        if (rowFields.length === 0) continue;
        // row에 한 필드만 남으면 단독 field 항목으로 평탄화 (1열 row는 의도 불명)
        if (rowFields.length === 1) {
          layout.push({ type: "field", fieldId: rowFields[0] });
        } else {
          layout.push({ type: "row", fields: [...rowFields] });
        }
      } else if (item.fieldId !== fieldId) {
        layout.push(item);
      }
    }
    applyStructure({ fields, layout });
    removeContactFieldDrafts(fieldId);
    if (selected?.kind === "contactField" && selected.fieldId === fieldId) {
      closeEditor();
    }
  };

  const handleExtractFromRow = (fieldId: string) => {
    const layout: ContactLayoutItem[] = [];
    let extracted = false;
    for (const item of structure.layout) {
      if (item.type !== "row") {
        layout.push(item);
        continue;
      }
      const idx = item.fields.indexOf(fieldId);
      if (idx === -1) {
        layout.push(item);
        continue;
      }
      const remaining = item.fields.filter((id) => id !== fieldId);
      if (remaining.length === 1) {
        layout.push({ type: "field", fieldId: remaining[0] });
      } else if (remaining.length > 1) {
        layout.push({ type: "row", fields: [...remaining] });
      }
      layout.push({ type: "field", fieldId });
      extracted = true;
    }
    if (!extracted) return;
    applyStructure({ ...structure, layout });
  };


  const renderLayoutItem = (item: ContactLayoutItem, index: number) => {
    if (item.type === "row") {
      return (
        <EditReorderRow
          index={index}
          dragIndex={dragIndex}
          dropTarget={dropTarget}
          rowShift={getRowShift(index)}
          busy={busy}
          fullWidth
          onDragStart={beginDrag}
        >
          <div className="grid w-full gap-6 md:grid-cols-2">
            {item.fields.map((fieldId) => {
              const field = getContactField(fieldId);
              if (!field) return null;
              return (
                <div key={fieldId} className="group relative min-w-0">
                  <EditInlineControls
                    busy={busy}
                    onSettings={() => openContactFieldEditor(fieldId)}
                    onExtract={() => handleExtractFromRow(fieldId)}
                    onDelete={() => void handleDelete(fieldId)}
                  />
                  <ContactFieldRenderer field={field} locale={locale} />
                </div>
              );
            })}
          </div>
        </EditReorderRow>
      );
    }

    const field = getContactField(item.fieldId);
    if (!field) return null;

    return (
      <EditReorderRow
        index={index}
        dragIndex={dragIndex}
        dropTarget={dropTarget}
        rowShift={getRowShift(index)}
        busy={busy}
        fullWidth
        onDragStart={beginDrag}
        controls={
          <EditInlineControls
            busy={busy}
            onSettings={() => openContactFieldEditor(item.fieldId)}
            onDelete={() => void handleDelete(item.fieldId)}
          />
        }
      >
        <ContactFieldRenderer field={field} locale={locale} />
      </EditReorderRow>
    );
  };

  // h-0 spacer + absolute overlay — visible 토글이 layout 을 밀어내지 않는다.
  // EditFlowInsertBar 와 동일한 위치 규약 (row 사이 24px gap 위 좌측 핸들 영역에 떠 있음).
  const renderInsertSlot = (index: number, enterHandler: () => void) => {
    const visible = isBarVisible(index);
    return (
      <div aria-hidden={!visible} className="pointer-events-none relative h-0">
        <div
          data-edit-hover-bridge
          className="pointer-events-auto absolute -left-12 h-6 w-[calc(100%+3rem)]"
          onMouseEnter={enterHandler}
          aria-hidden
        />
        <div
          data-edit-hover-bridge
          onMouseEnter={enterHandler}
          className={`pointer-events-auto absolute left-[-10%] top-0 z-30 -translate-y-[calc(50%+1.25rem)] transition-opacity duration-200 ease-out ${
            visible ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <EditAddPill
            busy={busy}
            label="필드 추가"
            onClick={() => handleAddFieldAt(index)}
          />
        </div>
      </div>
    );
  };

  return (
    <div onMouseLeave={scheduleLeave}>
      <EditReorderList className="space-y-10">
        {structure.layout.map((item, index) => (
          <Fragment key={layoutItemKey(item, index)}>
            {renderInsertSlot(index, () => {
              if (hoveredIndex === index - 1 || hoveredIndex === index) return;
              scheduleEnter(Math.max(0, index - 1));
            })}
            <div onMouseEnter={() => scheduleEnter(index)}>
              {renderLayoutItem(item, index)}
            </div>
          </Fragment>
        ))}
      </EditReorderList>
      {renderInsertSlot(structure.layout.length, () => {
        const last = structure.layout.length - 1;
        if (
          hoveredIndex === last ||
          hoveredIndex === structure.layout.length
        )
          return;
        scheduleEnter(Math.max(0, last));
      })}
    </div>
  );
}
