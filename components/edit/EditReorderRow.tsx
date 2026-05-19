"use client";

// 편집 블록 한 줄 — 본문 폭 유지, 드래그 핸들은 왼쪽 바깥에 절대 배치
import { EditDragHandle } from "@/components/edit/EditDragHandle";
import { EditDropGuide } from "@/components/edit/EditDropGuide";
import type { EditDropTarget } from "@/components/edit/useEditReorderDrag";

type Props = {
  index: number;
  dragIndex: number | null;
  dropTarget: EditDropTarget | null;
  busy?: boolean;
  orientation?: "vertical" | "horizontal";
  handleClassName?: string;
  onDragStart: (index: number) => void;
  onDropTarget: (index: number, clientCoord: number, rect: DOMRect) => void;
  onDrop: (index: number) => void;
  controls?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function EditReorderRow({
  index,
  dragIndex,
  dropTarget,
  busy,
  orientation = "vertical",
  handleClassName = "absolute -left-9 top-0.5 z-10",
  onDragStart,
  onDropTarget,
  onDrop,
  controls,
  children,
  className = "",
}: Props) {
  const isSource = dragIndex === index;
  const showBefore =
    dragIndex !== null && dropTarget?.index === index && dropTarget.position === "before";
  const showAfter =
    dragIndex !== null && dropTarget?.index === index && dropTarget.position === "after";

  return (
    <div
      data-edit-reorder-index={index}
      className={`relative ${className}`}
      onDragOver={(e) => {
        if (dragIndex === null) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        const rect = e.currentTarget.getBoundingClientRect();
        const coord = orientation === "horizontal" ? e.clientX : e.clientY;
        onDropTarget(index, coord, rect);
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDrop(index);
      }}
    >
      {showBefore ? <EditDropGuide position="before" orientation={orientation} /> : null}
      <EditDragHandle
        disabled={busy}
        index={index}
        className={handleClassName}
        onDragStart={() => onDragStart(index)}
      />
      <div className={`group relative min-w-0 ${isSource ? "opacity-50" : ""}`}>
        {controls}
        {children}
      </div>
      {showAfter ? <EditDropGuide position="after" orientation={orientation} /> : null}
    </div>
  );
}
