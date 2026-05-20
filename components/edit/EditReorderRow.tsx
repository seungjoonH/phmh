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
  /** true면 세로 정렬에서도 본문·입력이 컬럼 폭만큼 늘어남 (Contact 폼 등) */
  fullWidth?: boolean;
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
  fullWidth = false,
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
        e.stopPropagation();
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
      <div
        className={`group relative flex ${fullWidth || orientation === "horizontal" ? "w-full" : "w-fit"} max-w-full items-start gap-1.5 ${isSource ? "opacity-50" : ""}`}
      >
        <div
          className={
            fullWidth || orientation === "horizontal"
              ? "min-w-0 w-full flex-1"
              : "min-w-0"
          }
        >
          {children}
        </div>
        {controls}
      </div>
      {showAfter ? <EditDropGuide position="after" orientation={orientation} /> : null}
    </div>
  );
}
