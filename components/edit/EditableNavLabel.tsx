"use client";

// 내비 라벨 — 롱프레스로 locale 문구 편집, 짧은 클릭은 링크 동작
import { editTextAttrs } from "@/lib/edit/attrs";
import { isEditMode } from "@/lib/edit/env";

export function EditableNavLabel({
  labelKey,
  children,
}: {
  labelKey: string;
  children: React.ReactNode;
}) {
  if (!isEditMode()) {
    return <>{children}</>;
  }
  return (
    <span {...editTextAttrs(labelKey, { longPress: true })} className="inline-block">
      {children}
    </span>
  );
}
