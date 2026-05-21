"use client";

// 편집 모드 드래그 핸들 — pointerdown 기반(신규) + native drag(레거시) 양쪽 지원
type Props = {
  label?: string;
  disabled?: boolean;
  className?: string;
  index?: number;
  /** 현재 잡혀있는 핸들이면 시각적 active 상태 */
  active?: boolean;
  /** 신규: pointer 기반 드래그 진입점 */
  onPointerDownStart?: (e: React.PointerEvent<HTMLButtonElement>) => void;
  /** 레거시: native HTML5 drag 사용처용 */
  onDragStart?: () => void;
};

export function EditDragHandle({
  label = "순서 변경",
  disabled,
  className = "",
  index,
  active = false,
  onPointerDownStart,
  onDragStart,
}: Props) {
  const useNative = !onPointerDownStart && Boolean(onDragStart);
  return (
    <button
      type="button"
      disabled={disabled}
      draggable={useNative && !disabled}
      onPointerDown={(e) => {
        if (disabled) return;
        if (!onPointerDownStart) return;
        if (e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();
        onPointerDownStart(e);
      }}
      onDragStart={(e) => {
        if (!useNative || disabled) return;
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", "reorder");
        e.dataTransfer.setData(
          "application/x-phmh-reorder",
          String(index ?? 0),
        );
        onDragStart?.();
      }}
      className={`flex min-h-7 w-7 shrink-0 touch-none select-none items-center justify-center rounded-md border shadow-sm transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40 ${
        active
          ? "cursor-grabbing border-page-body/45 bg-page-body/25 text-page-body"
          : "cursor-grab border-page-body/20 bg-page-body/10 text-page-body/70 hover:border-page-body/35 hover:bg-page-body/20 active:cursor-grabbing"
      } ${className}`}
      aria-label={label}
      onClick={(e) => e.stopPropagation()}
    >
      <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
        <circle cx="4" cy="3" r="1" fill="currentColor" />
        <circle cx="8" cy="3" r="1" fill="currentColor" />
        <circle cx="4" cy="6" r="1" fill="currentColor" />
        <circle cx="8" cy="6" r="1" fill="currentColor" />
        <circle cx="4" cy="9" r="1" fill="currentColor" />
        <circle cx="8" cy="9" r="1" fill="currentColor" />
      </svg>
    </button>
  );
}
