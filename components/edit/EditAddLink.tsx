"use client";

// 편집 모드 추가 링크 — 본문 스타일과 동일한 텍스트 링크
type Props = {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
};

export function EditAddLink({ onClick, disabled, children, className = "" }: Props) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`interactive-link block text-left text-sm text-secondary disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}
