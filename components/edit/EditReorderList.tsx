"use client";

// 드래그 정렬 목록 — 행 사이 빈 gap에서도 drop 되도록 컨테이너가 받음
import { useCallback, useRef } from "react";
type Props = {
  dragIndex: number | null;
  axis?: "x" | "y";
  /** list: 세로/가로 1열·줄. grid: 다열 그리드(행 우선 인덱스) */
  layout?: "list" | "grid";
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

/** 3열 그리드 등 — DOM 순서(행 우선) 셀에 포인터가 닿는 인덱스 */
function findGridIndexFromPoint(
  root: HTMLElement,
  clientX: number,
  clientY: number,
): number {
  const rows = root.querySelectorAll<HTMLElement>("[data-edit-reorder-index]");
  if (rows.length === 0) return 0;

  for (let i = 0; i < rows.length; i++) {
    const rect = rows[i].getBoundingClientRect();
    if (
      clientX >= rect.left &&
      clientX <= rect.right &&
      clientY >= rect.top &&
      clientY <= rect.bottom
    ) {
      return i;
    }
  }

  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < rows.length; i++) {
    const rect = rows[i].getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const d = (clientX - cx) ** 2 + (clientY - cy) ** 2;
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  return best;
}

export function EditReorderList({
  dragIndex,
  axis = "y",
  layout = "list",
  pickDropTarget,
  onDrop,
  className = "",
  children,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const dropAxis = layout === "grid" ? "x" : axis;

  const indexFromPoint = useCallback(
    (root: HTMLElement, clientX: number, clientY: number) =>
      layout === "grid"
        ? findGridIndexFromPoint(root, clientX, clientY)
        : findRowIndexFromPoint(root, clientX, clientY, axis),
    [axis, layout],
  );

  const syncTargetAtPoint = useCallback(
    (clientX: number, clientY: number) => {
      const root = rootRef.current;
      if (!root || dragIndex === null) return;
      const index = indexFromPoint(root, clientX, clientY);
      const row = root.querySelector<HTMLElement>(
        `[data-edit-reorder-index="${index}"]`,
      );
      if (!row) return;
      const coord = dropAxis === "y" ? clientY : clientX;
      pickDropTarget(index, coord, row.getBoundingClientRect());
    },
    [dragIndex, dropAxis, indexFromPoint, pickDropTarget],
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
        const index = indexFromPoint(root, e.clientX, e.clientY);
        onDrop(index);
      }}
    >
      {children}
    </div>
  );
}
