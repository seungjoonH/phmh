"use client";

// 앱 공통 모달 다이얼로그 — window.confirm / window.alert 대체
import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { duration, fadeScale, motionTransition } from "@/lib/motion";

type ConfirmOptions = {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
};

type AlertOptions = {
  title?: string;
  message: string;
  okLabel?: string;
};

type DialogState =
  | { kind: "confirm"; options: ConfirmOptions; resolve: (v: boolean) => void }
  | { kind: "alert"; options: AlertOptions; resolve: () => void }
  | null;

type Listener = (state: DialogState) => void;

let current: DialogState = null;
const listeners = new Set<Listener>();

function setState(s: DialogState) {
  current = s;
  for (const l of listeners) l(s);
}

export function confirm(options: ConfirmOptions | string): Promise<boolean> {
  const opts: ConfirmOptions =
    typeof options === "string" ? { message: options } : options;
  return new Promise((resolve) => {
    setState({ kind: "confirm", options: opts, resolve });
  });
}

export function showAlert(options: AlertOptions | string): Promise<void> {
  const opts: AlertOptions =
    typeof options === "string" ? { message: options } : options;
  return new Promise((resolve) => {
    setState({ kind: "alert", options: opts, resolve });
  });
}

export function AppDialogHost() {
  const [state, setLocalState] = useState<DialogState>(current);
  const reduce = useReducedMotion();
  const titleId = useId();
  const descId = useId();
  const okRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const l: Listener = (s) => setLocalState(s);
    listeners.add(l);
    setLocalState(current);
    return () => {
      listeners.delete(l);
    };
  }, []);

  const resolveCancel = () => {
    if (!state) return;
    if (state.kind === "confirm") state.resolve(false);
    else state.resolve();
    setState(null);
  };

  const resolveConfirm = () => {
    if (!state) return;
    if (state.kind === "confirm") state.resolve(true);
    else state.resolve();
    setState(null);
  };

  useEffect(() => {
    if (!state) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        resolveCancel();
      } else if (e.key === "Enter") {
        e.preventDefault();
        resolveConfirm();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // resolveCancel/resolveConfirm depend on `state` only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  useEffect(() => {
    if (!state) return;
    const t = window.setTimeout(() => {
      okRef.current?.focus();
    }, 50);
    return () => window.clearTimeout(t);
  }, [state]);

  const isConfirm = state?.kind === "confirm";
  const title = state?.options.title;
  const message = state?.options.message ?? "";
  const danger = isConfirm && Boolean((state.options as ConfirmOptions).danger);
  const confirmLabel = state
    ? state.kind === "confirm"
      ? state.options.confirmLabel ?? "확인"
      : state.options.okLabel ?? "확인"
    : "확인";
  const cancelLabel = isConfirm
    ? (state.options as ConfirmOptions).cancelLabel ?? "취소"
    : null;

  return (
    <AnimatePresence>
      {state ? (
        <motion.div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={motionTransition(reduce, { duration: duration.fast })}
          onClick={resolveCancel}
        >
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-describedby={descId}
            className="w-full max-w-md rounded-lg bg-page-bg p-6 shadow-xl ring-1 ring-page-body/10"
            variants={fadeScale}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={motionTransition(reduce, { duration: duration.fast })}
            onClick={(e) => e.stopPropagation()}
          >
            {title ? (
              <h3
                id={titleId}
                className="mb-2 text-lg font-semibold text-page-heading"
              >
                {title}
              </h3>
            ) : null}
            <p
              id={descId}
              className="whitespace-pre-wrap text-sm leading-relaxed text-page-body"
            >
              {message}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              {isConfirm ? (
                <button
                  type="button"
                  onClick={resolveCancel}
                  className="interactive-button rounded-sm px-4 py-2 text-sm font-medium text-page-body hover:bg-page-body/5"
                >
                  {cancelLabel}
                </button>
              ) : null}
              <button
                ref={okRef}
                type="button"
                onClick={resolveConfirm}
                className={
                  danger
                    ? "interactive-button rounded-sm bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                    : "cta-primary"
                }
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
