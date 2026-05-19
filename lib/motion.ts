// 사이트 전역 모션 토큰·variants
import type { Transition, Variants } from "motion/react";

export const easeCalm = [0.22, 1, 0.36, 1] as const;

export const duration = {
  fast: 0.22,
  normal: 0.45,
  slow: 0.65,
} as const;

/** 스크롤 reveal: 1회만 재생 (경계에서 토글 시 떨림 방지) */
export const scrollRevealViewport = {
  once: true,
  amount: 0.12,
  margin: "0px 0px -8% 0px",
} as const;

/** 섹션 이미지 가로 슬라이드 스크롤 구간 */
export const scrollSlideOffsets = ["start 0.89", "start 0.44"] as const;

/** @deprecated scrollRevealViewport 사용 */
export const viewport = scrollRevealViewport;

/** 요소가 뷰포트를 지날 때 세로 시차(px) */
export const parallaxRange = {
  subtle: 28,
  normal: 44,
  strong: 72,
} as const;

/** 스크롤 진입 시 가로 슬라이드 거리(px) */
export const slideInRange = {
  normal: 64,
  strong: 96,
} as const;

export function motionTransition(
  reduce: boolean | null,
  extra?: Partial<Transition>,
): Transition {
  if (reduce) return { duration: 0 };
  return { duration: duration.normal, ease: easeCalm, ...extra };
}

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 36 },
  visible: { opacity: 1, y: 0 },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const fadeScale: Variants = {
  hidden: { opacity: 0, scale: 0.97, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0 },
};

/** 드롭다운: scale 금지(transform이 CSS 중앙정렬과 충돌) */
export const dropdownPanel: Variants = {
  hidden: { opacity: 0, y: -6 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};

export const mobileMenuPanel: Variants = {
  hidden: { opacity: 0, height: 0 },
  visible: { opacity: 1, height: "auto" },
  exit: { opacity: 0, height: 0 },
};

export const accordionPanel: Variants = {
  hidden: { opacity: 0, height: 0 },
  visible: { opacity: 1, height: "auto" },
  exit: { opacity: 0, height: 0 },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.09, delayChildren: 0.04 },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
};
