"use client";

// 스크롤 시 자식 순차 reveal (패럴랙스 없음)
import { useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  motionTransition,
  scrollRevealViewport,
  staggerContainer,
  staggerItem,
} from "@/lib/motion";

type ContainerProps = {
  children: React.ReactNode;
  className?: string;
};

export function RevealStagger({ children, className }: ContainerProps) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={scrollRevealViewport}
      variants={staggerContainer}
    >
      {children}
    </motion.div>
  );
}

export function RevealStaggerItem({ children, className }: ContainerProps) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      variants={staggerItem}
      transition={motionTransition(reduce)}
    >
      {children}
    </motion.div>
  );
}
