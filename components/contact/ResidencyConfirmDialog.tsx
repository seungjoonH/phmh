"use client";

// 전송 직전 거주지(한국/필리핀) 확인 다이얼로그
import { useEffect, useId } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { duration, fadeScale, motionTransition } from "@/lib/motion";

type Props = {
  open: boolean;
  country: string;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ResidencyConfirmDialog({
  open,
  country,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: Props) {
  const titleId = useId();
  const descId = useId();
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  const renderedMessage = message.replace("{country}", country);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={motionTransition(reduce, { duration: duration.fast })}
          onClick={onCancel}
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
            <h3
              id={titleId}
              className="text-lg font-semibold text-page-heading"
            >
              {title}
            </h3>
            <p id={descId} className="mt-3 text-sm text-page-body">
              {renderedMessage}
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="interactive-button rounded-sm px-4 py-2 text-sm font-medium text-page-body hover:bg-page-body/5"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="cta-primary"
                autoFocus
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
