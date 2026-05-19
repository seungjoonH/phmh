"use client";

// 이미지·미디어 블록 세로 패럴랙스 (바깥 레이아웃 고정, 내부만 transform)
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { parallaxRange } from "@/lib/motion";

type Props = {
  children: React.ReactNode;
  className?: string;
  offset?: number;
};

export function ParallaxMedia({
  children,
  className,
  offset = parallaxRange.strong,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [offset, -offset]);

  return (
    <motion.div ref={ref} className={className}>
      <motion.div
        className="relative h-full min-h-full w-full"
        style={reduce ? undefined : { y, willChange: "transform" }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
