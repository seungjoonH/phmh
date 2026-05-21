"use client";

// 편집 속성 패널 — 우측에서 슬라이드 인/아웃
import type { ReactNode } from "react";
import { useEffect } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useEditDraftOptional } from "@/components/edit/EditDraftProvider";
import { duration, motionTransition } from "@/lib/motion";

type Props = {
  children: ReactNode;
  className?: string;
  maxWidth?: "md" | "lg";
};

const maxWidthClass = {
  md: "max-w-md",
  lg: "max-w-lg",
} as const;

export function EditSidePanel({ children, className = "", maxWidth = "md" }: Props) {
  const reduce = useReducedMotion();
  const edit = useEditDraftOptional();
  const transition = motionTransition(reduce, { duration: duration.normal });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.isComposing) return;
      event.preventDefault();
      edit?.closeEditor();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [edit]);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      data-phmh-edit-panel
      initial={reduce ? false : { x: "100%" }}
      animate={{ x: 0 }}
      exit={reduce ? undefined : { x: "100%" }}
      transition={transition}
      className={`fixed inset-y-0 right-0 z-[80] flex w-full ${maxWidthClass[maxWidth]} flex-col border-l border-page-body/15 bg-page-bg shadow-xl ${className}`.trim()}
    >
      {children}
    </motion.div>
  );
}
