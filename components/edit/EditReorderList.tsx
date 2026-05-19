"use client";

// 드래그 정렬 목록 — 행 사이 빈 gap에서도 drop 되도록 컨테이너가 받음
import { useCallback, useRef } from "react";
type Props = {
  dragIndex: number | null;
  axis?: "x" | "y";
  pickDropTarget: (index: number, clientCoord: number, rect: DOMRect) => void;
  onDrop: (targetIndex: number) => void;
  className?: string;
  children: React.ReactNode;
};

function findRowIndexFromPoint(
  root: HTMLElement,
  clientX: number,
  clientY: number,
  axis: "x" | "y",
): number {
  const rows = root.querySelectorAll<HTMLElement>("[data-edit-reorder-index]");
  if (rows.length === 0) return 0;

  for (let i = 0; i < rows.length; i++) {
    const rect = rows[i].getBoundingClientRect();
    const mid = axis === "y" ? rect.top + rect.height / 2 : rect.left + rect.width / 2;
    const coord = axis === "y" ? clientY : clientX;
    if (coord < mid) return i;
  }
  return rows.length - 1;
}

export function EditReorderList({
  dragIndex,
  axis = "y",
  pickDropTarget,
  onDrop,
  className = "",
  children,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);

  const syncTargetAtPoint = useCallback(
    (clientX: number, clientY: number) => {
      const root = rootRef.current;
      if (!root || dragIndex === null) return;
      const index = findRowIndexFromPoint(root, clientX, clientY, axis);
      const row = root.querySelector<HTMLElement>(
        `[data-edit-reorder-index="${index}"]`,
      );
      if (!row) return;
      const coord = axis === "y" ? clientY : clientX;
      pickDropTarget(index, coord, row.getBoundingClientRect());
    },
    [axis, dragIndex, pickDropTarget],
  );

  return (
    <div
      ref={rootRef}
      className={className}
      onDragOver={(e) => {
        if (dragIndex === null) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        syncTargetAtPoint(e.clientX, e.clientY);
      }}
      onDrop={(e) => {
        if (dragIndex === null) return;
        e.preventDefault();
        const root = rootRef.current;
        if (!root) return;
        const index = findRowIndexFromPoint(root, e.clientX, e.clientY, axis);
        onDrop(index);
      }}
    >
      {children}
    </div>
  );
}
