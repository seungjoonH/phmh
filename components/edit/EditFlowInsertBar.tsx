"use client";

// flow 블록 사이·끝 — 블록 종류 선택 추가
import { useState } from "react";
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
  onInsert: (index: number, type: FlowBlockInsertType) => void;
};

export function EditFlowInsertBar({
  index,
  busy,
  canInsertImage,
  onInsert,
}: Props) {
  const [open, setOpen] = useState(false);

  const options = INSERT_OPTIONS.filter(
    (opt) => opt.type !== "img" || canInsertImage,
  );

  return (
    <div className="relative py-1">
      <EditAddLink
        disabled={busy}
        onClick={() => setOpen((v) => !v)}
        className="text-xs"
      >
        {busy ? "추가 중…" : "+ 추가"}
      </EditAddLink>
      {open ? (
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
                setOpen(false);
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
