"use client";

// 편집 컨트롤 — 호버 시에만 표시, 본문·사이드바와 같은 보조 톤
/** 부모에 `group` 필요 (EditReorderRow flex 행) */
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
      className={`flex shrink-0 items-start gap-0.5 pt-0.5 ${editHoverControlsClass}`}
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
