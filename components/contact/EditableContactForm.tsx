"use client";

// 편집 모드 Contact 폼 — 본문과 동일한 UI, 변경은 툴바「저장」까지 미리보기만
import { useCallback, useMemo } from "react";
import { ContactFieldRenderer } from "@/components/contact/ContactFieldRenderer";
import { EditAddLink } from "@/components/edit/EditAddLink";
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

type Props = {
  locale: ContactFormLocaleKey;
  onStructureChange?: () => void;
};

function layoutItemKey(item: ContactLayoutItem): string {
  return item.type === "row" ? `row:${item.fields.join(",")}` : `field:${item.fieldId}`;
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
    contactStructureDraft,
    setContactStructureDraft,
    setDraftEntry,
    applyArrayDraft,
    committing,
  } = useEditDraft();

  const structure = useMemo(
    () => contactStructureDraft ?? getContactFormStructure(),
    [contactStructureDraft],
  );

  const {
    dragIndex,
    dropTarget,
    setDragIndex,
    pickDropTarget,
    createDropHandler,
  } = useEditReorderDrag();

  const busy = committing;

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

  const handleDrop = createDropHandler((from, insertAt) => {
    const layout = [...structure.layout];
    const [moved] = layout.splice(from, 1);
    layout.splice(insertAt, 0, moved);
    applyStructure({ ...structure, layout });
  });

  const handleAddField = () => {
    const id = `field_${Date.now().toString(36).slice(-8)}`;
    const field = defaultNewField(id);
    const layout: ContactLayoutItem[] = [
      ...structure.layout,
      { type: "field", fieldId: id },
    ];
    applyStructure({
      fields: [...structure.fields, field],
      layout,
    });
    seedFieldCopyDrafts(id);
    openContactFieldEditor(id);
  };

  const handleDelete = (fieldId: string) => {
    if (!window.confirm("이 필드를 삭제할까요? 저장 시 locale 문구도 함께 제거됩니다.")) return;
    const fields = structure.fields.filter((f) => f.id !== fieldId);
    const layout: ContactLayoutItem[] = [];
    for (const item of structure.layout) {
      if (item.type === "row") {
        const rowFields = item.fields.filter((id) => id !== fieldId);
        if (rowFields.length > 0) layout.push({ type: "row", fields: [...rowFields] });
      } else if (item.fieldId !== fieldId) {
        layout.push(item);
      }
    }
    applyStructure({ fields, layout });
  };


  const renderLayoutItem = (item: ContactLayoutItem, index: number) => {
    if (item.type === "row") {
      return (
        <EditReorderRow
          key={layoutItemKey(item)}
          index={index}
          dragIndex={dragIndex}
          dropTarget={dropTarget}
          busy={busy}
          onDragStart={setDragIndex}
          onDropTarget={pickDropTarget}
          onDrop={handleDrop}
        >
          <div className="grid gap-6 md:grid-cols-2">
            {item.fields.map((fieldId) => {
              const field = getContactField(fieldId);
              if (!field) return null;
              return (
                <div key={fieldId} className="group relative min-w-0">
                  <EditInlineControls
                    busy={busy}
                    onSettings={() => openContactFieldEditor(fieldId)}
                    onDelete={() => handleDelete(fieldId)}
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
        key={layoutItemKey(item)}
        index={index}
        dragIndex={dragIndex}
        dropTarget={dropTarget}
        busy={busy}
        onDragStart={setDragIndex}
        onDropTarget={pickDropTarget}
        onDrop={handleDrop}
        controls={
          <EditInlineControls
            busy={busy}
            onSettings={() => openContactFieldEditor(item.fieldId)}
            onDelete={() => handleDelete(item.fieldId)}
          />
        }
      >
        <ContactFieldRenderer field={field} locale={locale} />
      </EditReorderRow>
    );
  };

  return (
    <>
      <EditReorderList
        dragIndex={dragIndex}
        pickDropTarget={pickDropTarget}
        onDrop={handleDrop}
        className="space-y-6"
      >
        {structure.layout.map((item, index) => renderLayoutItem(item, index))}
      </EditReorderList>
      <EditAddLink disabled={busy} onClick={handleAddField}>
        + 필드 추가
      </EditAddLink>
    </>
  );
}
