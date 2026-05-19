"use client";

// 편집 모드 드래그 핸들 — 블록 왼쪽 앞에 배치
type Props = {
  label?: string;
  disabled?: boolean;
  className?: string;
  index?: number;
  onDragStart: () => void;
};

export function EditDragHandle({
  label = "순서 변경",
  disabled,
  className = "",
  index,
  onDragStart,
}: Props) {
  return (
    <button
      type="button"
      draggable={!disabled}
      disabled={disabled}
      onDragStart={(e) => {
        if (disabled) return;
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", "reorder");
        e.dataTransfer.setData(
          "application/x-phmh-reorder",
          String(index ?? 0),
        );
        onDragStart();
      }}
      className={`flex size-7 shrink-0 cursor-grab items-center justify-center rounded-full border border-page-body/20 bg-page-body/10 text-page-body/70 shadow-sm hover:border-page-body/35 hover:bg-page-body/20 active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
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
