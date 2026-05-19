"use client";

// 미저장 편집 키 — 해당 요소에 노란 점 표시
import { useEffect } from "react";
import { useEditDraft } from "@/components/edit/EditDraftProvider";

export function EditPendingMarkers() {
  const { isEditKeyPending, drafts, imageDrafts, pendingCount } = useEditDraft();

  useEffect(() => {
    const nodes = document.querySelectorAll<HTMLElement>("[data-phmh-key]");
    for (const el of nodes) {
      const key = el.dataset.phmhKey;
      if (!key) continue;
      if (isEditKeyPending(key)) {
        el.classList.add("phmh-edit-pending");
      } else {
        el.classList.remove("phmh-edit-pending");
      }
    }
  }, [isEditKeyPending, drafts, imageDrafts, pendingCount]);

  return null;
}
