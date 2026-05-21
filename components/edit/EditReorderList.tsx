"use client";

// 드래그 정렬 컨테이너 — pointer 기반 드래그로 바뀌어 단순 wrapper 역할
import type { ReactNode } from "react";

type Props = {
  className?: string;
  children: ReactNode;
  // backward-compat (모두 무시됨)
  dragIndex?: number | null;
  axis?: "x" | "y";
  layout?: "list" | "grid";
  pickDropTarget?: (...args: unknown[]) => void;
  onDrop?: (...args: unknown[]) => void;
};

export function EditReorderList({ className = "", children }: Props) {
  return (
    <div data-edit-reorder-list className={className}>
      {children}
    </div>
  );
}
