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
  /** 외부에서 계산된 라이브 미리보기 shift(px) — 2D 객체 또는 단일 axis number(레거시) */
  rowShift?: RowShift | number;
  busy?: boolean;
  orientation?: "vertical" | "horizontal";
  handleClassName?: string;
  /** true면 핸들 자체를 렌더하지 않음 (= 이동 불가 row, 예: 섹션 타이틀·섹션 헤더 이미지) */
  hideHandle?: boolean;
  /** pointerdown으로 드래그 시작 — hook의 beginDrag 전달 */
  onDragStart: (
    index: number,
    rowEl: HTMLElement,
    e: React.PointerEvent,
  ) => void;
  controls?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** true면 세로 정렬에서도 본문·입력이 컬럼 폭만큼 늘어남 */
  fullWidth?: boolean;
  /** drop target outline(grid 등 row shift=0 일 때 위치 미리보기용) */
  dropTarget?: EditDropTarget | null;
  /** backward-compat: 더 이상 사용 안 함 (무시) */
  onDropTarget?: (...args: unknown[]) => void;
  onDrop?: (...args: unknown[]) => void;
};

export function EditReorderRow({
  index,
  dragIndex,
  rowShift = 0,
  busy,
  orientation = "vertical",
  handleClassName = "absolute -left-9 inset-y-0 z-10",
  hideHandle = false,
  onDragStart,
  controls,
  children,
  className = "",
  fullWidth = false,
  dropTarget,
  onDropTarget: _odt,
  onDrop: _od,
}: Props) {
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
  const isShifted = shiftX !== 0 || shiftY !== 0;
  // shift 가 0 인 fallback(예: grid 1행) 일 때만 drop target 카드에 outline 으로 위치 표시.
  const isDropTarget =
    !isSource && isDragging && !isShifted && dropTarget?.index === index;

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
      // hideHandle 인 row(섹션 타이틀·섹션 헤더 이미지) 는 본문 내 이동 불가 → drag/drop 측정 대상에서 제외.
      data-edit-reorder-index={hideHandle ? undefined : index}
      data-edit-hover-bridge
      className={`relative ${className}`}
      style={{
        transform,
        // drag 중에도 transition 유지 — getCurrentTranslate() 가 보간된 transform 을
        // 정확히 빼주므로 dropTarget 측정에 영향 없음. 부드러운 스르륵 reorder.
        transition: "transform 460ms cubic-bezier(0.16, 1, 0.3, 1)",
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
          style={{
            backgroundColor: isSource
              ? "color-mix(in srgb, var(--color-primary) 10%, transparent)"
              : undefined,
            boxShadow: isSource
              ? "inset 0 0 0 1.5px color-mix(in srgb, var(--color-primary) 35%, transparent)"
              : isDropTarget
                ? `inset 0 0 0 2px color-mix(in srgb, var(--color-primary) 60%, transparent),
                   ${
                     dropTarget?.position === "before"
                       ? orientation === "horizontal"
                         ? "inset 6px 0 0 0 var(--color-primary)"
                         : "inset 0 6px 0 0 var(--color-primary)"
                       : orientation === "horizontal"
                         ? "inset -6px 0 0 0 var(--color-primary)"
                         : "inset 0 -6px 0 0 var(--color-primary)"
                   }`
                : undefined,
            transition:
              "background-color 240ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 240ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          {!hideHandle && (
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
