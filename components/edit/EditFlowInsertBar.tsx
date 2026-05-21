"use client";

// flow 블록 사이·끝 — row 사이 gap 위에 absolute 로 떠 있는 추가 버튼 (layout shift 없음)
import { useEffect, useRef } from "react";
import { EditAddPill } from "@/components/edit/EditAddPill";
import type { FlowBlockInsertType } from "@/lib/edit/section-flow";

const ALL_INSERT_OPTIONS: { type: FlowBlockInsertType; label: string }[] = [
  { type: "p", label: "문단" },
  { type: "heading", label: "소제목" },
  { type: "img", label: "이미지" },
  { type: "button", label: "버튼" },
  { type: "hr", label: "구분선" },
  { type: "list", label: "목록" },
];

type Props = {
  index: number;
  busy?: boolean;
  isOpen: boolean;
  /** hover 기반 노출 제어 — false면 collapsed (isOpen이면 항상 노출) */
  visible?: boolean;
  /**
   * hover 중인 row 를 기준으로 본 + 버튼의 시각적 역할.
   * "above": 현재 row 의 윗 추가 → row 위로 충분히 띄움
   * "below": 현재 row 의 아랫 추가 → row 아래로 충분히 띄움
   */
  placement?: "above" | "below";
  /** 사용처별로 허용할 블록 타입 화이트리스트 (미지정 시 전체 노출) */
  insertTypes?: readonly FlowBlockInsertType[];
  /** bar 영역 위로 마우스가 들어왔을 때 (hover 상태 유지용) */
  onWrapperMouseEnter?: () => void;
  onOpen: (index: number) => void;
  onClose: () => void;
  onInsert: (index: number, type: FlowBlockInsertType) => void;
};

export function EditFlowInsertBar({
  index,
  busy,
  isOpen,
  visible = true,
  placement: _placement,
  insertTypes,
  onWrapperMouseEnter,
  onOpen,
  onClose,
  onInsert,
}: Props) {
  const options = insertTypes
    ? ALL_INSERT_OPTIONS.filter((o) => insertTypes.includes(o.type))
    : ALL_INSERT_OPTIONS;
  void _placement;
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

  const expanded = visible || isOpen;

  return (
    // spacer 자체는 항상 h-0 — row 사이 layout 을 밀어내지 않는다.
    <div
      ref={rootRef}
      aria-hidden={!expanded}
      className="pointer-events-none relative h-0"
    >
      {/* hover bridge — row 사이 gap 영역. row 와 + 버튼을 잇는다. */}
      <div
        data-edit-hover-bridge
        className="pointer-events-auto absolute -left-12 h-6 w-[calc(100%+3rem)]"
        onMouseEnter={onWrapperMouseEnter}
        aria-hidden
      />
      {/* + 버튼 — 좌측 핸들 영역(-left-12) 위로 absolute over.
          위치는 placement 와 무관하게 고정 — hover 상태가 above/below 토글돼도
          버튼이 슉 움직이지 않도록 transform 은 transition 대상에서 제외. */}
      <div
        data-edit-hover-bridge
        onMouseEnter={onWrapperMouseEnter}
        className={`pointer-events-auto absolute -left-12 top-0 -translate-y-[calc(50%+1.25rem)] transition-opacity duration-200 ease-out ${
          isOpen ? "z-50" : "z-30"
        } ${expanded ? "opacity-100" : "pointer-events-none opacity-0"}`}
      >
        <div className="relative inline-block">
          <EditAddPill
            busy={busy}
            label="추가"
            onClick={() => (isOpen ? onClose() : onOpen(index))}
          />
          {isOpen ? (
            <div
              className="absolute left-0 top-full z-50 mt-2 min-w-[9rem] rounded border border-page-body/20 bg-page-bg py-1 shadow-lg"
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
      </div>
    </div>
  );
}
