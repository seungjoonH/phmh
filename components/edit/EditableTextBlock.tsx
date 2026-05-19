"use client";

// 편집 모드 텍스트 블록 — 호버 시 삭제·편집
import { EditInlineControls } from "@/components/edit/EditInlineControls";
import { editTextAttrs } from "@/lib/edit/attrs";
import { isEditMode } from "@/lib/edit/env";

type Props = {
  editKey: string;
  children: React.ReactNode;
  className?: string;
  onDelete?: () => void;
  longPress?: boolean;
};

export function EditableTextBlock({
  editKey,
  children,
  className = "",
  onDelete,
  longPress = true,
}: Props) {
  if (!isEditMode()) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={`group relative ${className}`}>
      {onDelete ? (
        <EditInlineControls onDelete={onDelete} />
      ) : null}
      <div {...editTextAttrs(editKey, { longPress })}>{children}</div>
    </div>
  );
}
