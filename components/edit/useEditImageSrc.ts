"use client";

// edit 초안 이미지 src (blob 미리보기)
import { useEditDraftOptional } from "@/components/edit/EditDraftProvider";
import { isEditMode } from "@/lib/edit/env";

export function useEditImageSrc(key: string, committedSrc: string): string {
  const edit = useEditDraftOptional();
  if (!isEditMode() || !edit) return committedSrc;
  return edit.getImagePreviewSrc(key, committedSrc);
}
