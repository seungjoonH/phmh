"use client";

// 편집 컨트롤 — 호버 시에만 표시, 본문·사이드바와 같은 보조 톤
/** 부모에 `group relative` 필요 (EditReorderRow 내부 flex-1 영역) */
export const editHoverControlsClass =
  "pointer-events-none opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100";

export const editControlButtonClass =
  "interactive-button rounded px-1.5 py-0.5 text-xs text-secondary hover:bg-page-body/5 hover:text-page-body disabled:opacity-40";

export const editControlDeleteClass = "edit-control-delete";

type Props = {
  onSettings?: () => void;
  onDelete?: () => void;
  busy?: boolean;
};

export function EditInlineControls({ onSettings, onDelete, busy }: Props) {
  if (!onSettings && !onDelete) return null;

  return (
    <div
      className={`absolute right-0 top-0 z-20 flex -translate-y-full gap-0.5 pb-0.5 ${editHoverControlsClass}`}
      onClick={(e) => e.stopPropagation()}
    >
      {onSettings ? (
        <button
          type="button"
          disabled={busy}
          onClick={onSettings}
          className={editControlButtonClass}
          aria-label="설정"
        >
          설정
        </button>
      ) : null}
      {onDelete ? (
        <button
          type="button"
          disabled={busy}
          onClick={onDelete}
          className={editControlDeleteClass}
          aria-label="삭제"
        >
          삭제
        </button>
      ) : null}
    </div>
  );
}
