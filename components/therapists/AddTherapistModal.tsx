"use client";

// 상담사 추가 — 이름 입력 모달 (네이티브 prompt 대신)
import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { duration, fadeScale, motionTransition } from "@/lib/motion";

type Props = {
  open: boolean;
  busy?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (name: string) => void;
};

export function AddTherapistModal({
  open,
  busy = false,
  error = null,
  onClose,
  onSubmit,
}: Props) {
  const titleId = useId();
  const descId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const reduce = useReducedMotion();
  const [name, setName] = useState("");

  useEffect(() => {
    if (!open) return;
    setName("");
    const t = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, busy, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || busy) return;
    onSubmit(trimmed);
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={motionTransition(reduce, { duration: duration.fast })}
          onClick={() => {
            if (!busy) onClose();
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descId}
            className="w-full max-w-md rounded-lg bg-page-bg p-6 shadow-xl ring-1 ring-page-body/10"
            variants={fadeScale}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={motionTransition(reduce, { duration: duration.fast })}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 id={titleId} className="text-lg font-semibold text-page-heading">
                  상담사 추가
                </h3>
                <p id={descId} className="mt-1 text-sm text-page-body/80">
                  표시 이름을 입력하세요. 영문·Ph.D. 등을 포함할 수 있습니다.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={busy}
                className="interactive-button -mr-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-2xl leading-none text-page-body hover:bg-page-body/5 hover:text-secondary disabled:opacity-40"
                aria-label="닫기"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-page-heading">
                  이름 <span className="text-page-body/60">*</span>
                </span>
                <input
                  ref={inputRef}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={busy}
                  placeholder="Dr. Jane Doe, Ph.D."
                  className="input-underline"
                  autoComplete="off"
                />
              </label>

              {error ? (
                <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                  {error}
                </p>
              ) : null}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={busy}
                  className="interactive-button rounded-sm px-4 py-2 text-sm font-medium text-page-body hover:bg-page-body/5 disabled:opacity-40"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={!name.trim() || busy}
                  className="cta-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {busy ? "추가 중…" : "추가"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
