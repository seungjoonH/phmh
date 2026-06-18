"use client";

// 편집 블록 한 줄 — 본문 폭 유지, 드래그 핸들은 왼쪽 바깥에 절대 배치
import { useCallback, useRef } from "react";
import { EditDragHandle } from "@/components/edit/EditDragHandle";
import type {
  EditDropTarget,
  RowShift,
} from "@/components/edit/useEditReorderDrag";

type Props = {
  index: number;
  dragIndex: number | null;
  rowShift?: RowShift | number;
  busy?: boolean;
  orientation?: "vertical" | "horizontal";
  handleClassName?: string;
  hideHandle?: boolean;
  onDragStart: (
    index: number,
    rowEl: HTMLElement,
    e: React.PointerEvent,
  ) => void;
  controls?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
  dropTarget?: EditDropTarget | null;
  onDropTarget?: (...args: unknown[]) => void;
  onDrop?: (...args: unknown[]) => void;
};

export function EditReorderRow({
  index,
  dragIndex,
  rowShift = 0,
  busy,
  orientation = "vertical",
  handleClassName = "absolute -left-9 top-0 z-10",
  hideHandle = false,
  onDragStart,
  controls,
  children,
  className = "",
  fullWidth = false,
  dropTarget: _dropTarget,
  onDropTarget: _odt,
  onDrop: _od,
}: Props) {
  void _dropTarget;
  void _odt;
  void _od;

  const rootRef = useRef<HTMLDivElement>(null);
  const isSource = dragIndex === index;
  const isDragging = dragIndex !== null;
  const shiftX =
    typeof rowShift === "number"
      ? orientation === "horizontal"
        ? rowShift
        : 0
      : rowShift.x;
  const shiftY =
    typeof rowShift === "number"
      ? orientation === "horizontal"
        ? 0
        : rowShift
      : rowShift.y;
  const isShifted = !isSource && (shiftX !== 0 || shiftY !== 0);

  const handlePointerStart = useCallback(
    (e: React.PointerEvent) => {
      const el = rootRef.current;
      if (!el) return;
      onDragStart(index, el, e);
    },
    [index, onDragStart],
  );

  const transform = isShifted
    ? `translate3d(${shiftX}px,${shiftY}px,0)`
    : undefined;

  return (
    <div
      ref={rootRef}
      data-edit-reorder-index={hideHandle ? undefined : index}
      data-edit-hover-bridge
      className={`relative ${className}`}
      style={{
        visibility: isSource ? "hidden" : undefined,
        transform,
        transition: isDragging
          ? undefined
          : "transform 460ms cubic-bezier(0.16, 1, 0.3, 1)",
        willChange: isDragging ? "transform" : undefined,
      }}
    >
      <div
        className={`group relative flex ${fullWidth || orientation === "horizontal" ? "w-full" : "w-fit"} max-w-full items-start gap-1.5`}
      >
        <div
          data-edit-clone-target
          className={`relative rounded-md ${
            fullWidth || orientation === "horizontal"
              ? "min-w-0 w-full flex-1"
              : "min-w-0"
          }`}
        >
          {!hideHandle && !isSource && (
            <EditDragHandle
              disabled={busy}
              active={isSource}
              index={index}
              className={handleClassName}
              onPointerDownStart={handlePointerStart}
            />
          )}
          <div
            data-edit-source-hide={isSource ? "true" : undefined}
            style={{ visibility: isSource ? "hidden" : undefined }}
          >
            {children}
          </div>
        </div>
        {controls ? (
          <div
            data-edit-source-hide={isSource ? "true" : undefined}
            style={{ visibility: isSource ? "hidden" : undefined }}
          >
            {controls}
          </div>
        ) : null}
      </div>
    </div>
  );
}
