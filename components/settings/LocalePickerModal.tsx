"use client";

// 추가할 locale 선택 팝업
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { LocaleOption } from "@/lib/site-locales";
import { duration, fadeScale, motionTransition } from "@/lib/motion";

type Props = {
  open: boolean;
  options: LocaleOption[];
  onClose: () => void;
  onSelect: (id: string) => void;
};

export function LocalePickerModal({ open, options, onClose, onSelect }: Props) {
  const reduce = useReducedMotion();

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="locale-picker-title"
            className="w-full max-w-md rounded-lg bg-page-bg p-6 shadow-xl"
            variants={fadeScale}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={motionTransition(reduce, { duration: duration.fast })}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 id="locale-picker-title" className="text-lg font-semibold text-page-heading">
                언어 추가
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="interactive-button rounded p-1 text-xl text-page-body hover:bg-page-body/10"
                aria-label="닫기"
              >
                ×
              </button>
            </div>
            <motion.div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {options.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onSelect(opt.id)}
                  className="interactive-button flex flex-col items-center gap-2 rounded-lg border border-page-body/15 p-3 hover:border-primary hover:bg-primary/5"
                >
                  <Image src={opt.flagSrc} alt="" width={40} height={24} className="h-6 w-10" />
                  <span className="text-xs text-page-body">{opt.label}</span>
                </button>
              ))}
            </motion.div>
            {options.length === 0 ? (
              <p className="mt-4 text-center text-sm text-page-body/70">
                추가할 수 있는 언어가 없습니다.
              </p>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
