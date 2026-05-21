"use client";

// 편집 사이드 패널 뒤 dim — 클릭 시 변경 유지하고 패널만 슬라이드 아웃
import { motion, useReducedMotion } from "motion/react";
import { useEditDraft } from "@/components/edit/EditDraftProvider";
import { duration, motionTransition } from "@/lib/motion";

export function EditPanelBackdrop() {
  const { closeEditor } = useEditDraft();
  const reduce = useReducedMotion();
  const transition = motionTransition(reduce, { duration: duration.normal });

  return (
    <motion.button
      type="button"
      aria-label="패널 닫기"
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reduce ? undefined : { opacity: 0 }}
      transition={transition}
      className="fixed inset-0 z-[70] cursor-default bg-black/25"
      onClick={closeEditor}
    />
  );
}
