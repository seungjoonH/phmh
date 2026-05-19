"use client";

// 스크롤 진입 reveal (패럴랙스 없음 — sticky·고정 헤더와 충돌 방지)
import { useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  fadeIn,
  fadeInUp,
  motionTransition,
  scrollRevealViewport,
} from "@/lib/motion";

type Props = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  variant?: "up" | "fade";
};

export function Reveal({
  children,
  className,
  delay = 0,
  variant = "up",
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const variants = variant === "fade" ? fadeIn : fadeInUp;

  return (
    <div ref={ref} className={className}>
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={scrollRevealViewport}
        variants={variants}
        transition={motionTransition(reduce, { delay })}
      >
        {children}
      </motion.div>
    </div>
  );
}
