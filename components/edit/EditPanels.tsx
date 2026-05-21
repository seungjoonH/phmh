"use client";

// 속성 패널 라우터 (텍스트 / 이미지 / 목록)
import { AnimatePresence } from "motion/react";
import { useEditDraft } from "@/components/edit/EditDraftProvider";
import { EditPanelBackdrop } from "@/components/edit/EditPanelBackdrop";
import { ImagePropertyPanel } from "@/components/edit/ImagePropertyPanel";
import { ContactFieldConfigPanel } from "@/components/contact/ContactFieldConfigPanel";
import { ListPropertyPanel } from "@/components/edit/ListPropertyPanel";
import { PropertyPanel } from "@/components/edit/PropertyPanel";

export function EditPanels() {
  const { selected } = useEditDraft();

  return (
    <AnimatePresence mode="wait">
      {selected ? <EditPanelBackdrop key="edit-panel-backdrop" /> : null}
      {selected?.kind === "image" ? (
        <ImagePropertyPanel key={`image-${selected.key}`} />
      ) : null}
      {selected?.kind === "contactField" ? (
        <ContactFieldConfigPanel key={`contact-${selected.fieldId}`} />
      ) : null}
      {selected?.kind === "text" ? (
        <PropertyPanel key={`text-${selected.key}`} />
      ) : null}
      {selected?.kind === "list" ? (
        <ListPropertyPanel key={`list-${selected.key}`} />
      ) : null}
    </AnimatePresence>
  );
}
