"use client";

// locale 문자열 배열 하단 추가 — 본문과 같은 링크 스타일
import { EditAddLink } from "@/components/edit/EditAddLink";
import { useEditDraftOptional } from "@/components/edit/EditDraftProvider";
import { isEditMode } from "@/lib/edit/env";

type Props = {
  arrayKey: string;
  label?: string;
};

export function EditArrayAddButton({
  arrayKey,
  label = "+ 문단 추가",
}: Props) {
  const edit = useEditDraftOptional();
  if (!isEditMode() || !edit) return null;

  return (
    <EditAddLink
      disabled={edit.arrayBusy === arrayKey}
      onClick={() => void edit.addArrayItem(arrayKey)}
      className="mt-2"
    >
      {edit.arrayBusy === arrayKey ? "추가 중…" : label}
    </EditAddLink>
  );
}
