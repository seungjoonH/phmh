"use client";

// flow 블록 사이·끝 — 블록 종류 선택 추가
import { useEffect, useRef } from "react";
import { EditAddLink } from "@/components/edit/EditAddLink";
import type { FlowBlockInsertType } from "@/lib/edit/section-flow";

const INSERT_OPTIONS: { type: FlowBlockInsertType; label: string }[] = [
  { type: "p", label: "문단" },
  { type: "heading", label: "소제목" },
  { type: "img", label: "이미지" },
  { type: "button", label: "버튼" },
  { type: "hr", label: "구분선" },
  { type: "bullets", label: "불릿 목록" },
];

type Props = {
  index: number;
  busy?: boolean;
  canInsertImage?: boolean;
  isOpen: boolean;
  onOpen: (index: number) => void;
  onClose: () => void;
  onInsert: (index: number, type: FlowBlockInsertType) => void;
};

export function EditFlowInsertBar({
  index,
  busy,
  canInsertImage,
  isOpen,
  onOpen,
  onClose,
  onInsert,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [isOpen, onClose]);

  const options = INSERT_OPTIONS.filter(
    (opt) => opt.type !== "img" || canInsertImage,
  );

  return (
    <div ref={rootRef} className="relative py-1">
      <EditAddLink
        disabled={busy}
        onClick={() => (isOpen ? onClose() : onOpen(index))}
        className="text-xs"
      >
        {busy ? "추가 중…" : "+ 추가"}
      </EditAddLink>
      {isOpen ? (
        <div
          className="absolute left-0 top-full z-20 mt-1 min-w-[9rem] rounded border border-page-body/15 bg-page-bg py-1 shadow-lg"
          role="menu"
        >
          {options.map((opt) => (
            <button
              key={opt.type}
              type="button"
              role="menuitem"
              className="block w-full px-3 py-1.5 text-left text-sm text-page-body hover:bg-page-body/10"
              onClick={() => {
                onClose();
                onInsert(index, opt.type);
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
