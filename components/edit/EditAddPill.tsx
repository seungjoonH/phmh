"use client";

// 편집 모드 + 버튼 (불투명 박스) — InsertBar·필드/스텝/카드 추가 자리에서 공통 사용
type Props = {
  onClick: () => void;
  disabled?: boolean;
  label: string;
  busyLabel?: string;
  busy?: boolean;
  className?: string;
};

export function EditAddPill({
  onClick,
  disabled,
  label,
  busyLabel = "추가 중…",
  busy = false,
  className = "",
}: Props) {
  return (
    <button
      type="button"
      disabled={disabled || busy}
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-md border border-page-body/30 bg-page-bg px-2.5 py-1 text-xs font-medium text-secondary shadow-sm hover:bg-page-body/5 disabled:opacity-50 ${className}`}
    >
      <span aria-hidden className="text-base leading-none">
        +
      </span>
      <span>{busy ? busyLabel : label}</span>
    </button>
  );
}
