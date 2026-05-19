"use client";

// 편집 패널 열림 시 본문 클릭으로 패널만 닫기 (초안 유지)
import { useEffect } from "react";
import { useEditDraft } from "@/components/edit/EditDraftProvider";
import { shouldSuppressPanelDismiss } from "@/lib/edit/long-press-gesture";

export function EditPanelDismiss() {
  const { selected, closeEditor } = useEditDraft();

  useEffect(() => {
    if (!selected) return;

    const onPointerDown = (e: PointerEvent) => {
      if (shouldSuppressPanelDismiss(e.pointerId)) return;

      const target = e.target;
      if (!(target instanceof Element)) return;
      if (target.closest("[data-phmh-edit-panel]")) return;
      if (target.closest("[data-phmh-edit-controller]")) return;
      if (target.closest("[data-phmh-edit]")) return;
      closeEditor();
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [selected, closeEditor]);

  return null;
}
