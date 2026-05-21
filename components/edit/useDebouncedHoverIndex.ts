// hover index 를 in/out delay 로 debounce — insert bar 토글과 highlight 시퀀싱
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Options = {
  /** 마우스 진입 후 hover state 가 반영되기까지의 지연(ms) */
  inDelayMs: number;
  /** 마우스 이탈 후 hover state 가 해제되기까지의 지연(ms) */
  outDelayMs: number;
  /** true 면 hover 가 즉시 해제되고 모든 schedule 호출이 무시됨 (드래그 중 등) */
  disabled?: boolean;
};

export function useDebouncedHoverIndex({
  inDelayMs,
  outDelayMs,
  disabled = false,
}: Options) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const inTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const outTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (inTimerRef.current) {
      clearTimeout(inTimerRef.current);
      inTimerRef.current = null;
    }
    if (outTimerRef.current) {
      clearTimeout(outTimerRef.current);
      outTimerRef.current = null;
    }
  }, []);

  const scheduleEnter = useCallback(
    (next: number) => {
      if (disabled) return;
      clearTimers();
      inTimerRef.current = setTimeout(() => {
        inTimerRef.current = null;
        setHoveredIndex(next);
      }, inDelayMs);
    },
    [clearTimers, disabled, inDelayMs],
  );

  const scheduleLeave = useCallback(() => {
    if (disabled) return;
    clearTimers();
    outTimerRef.current = setTimeout(() => {
      outTimerRef.current = null;
      setHoveredIndex(null);
    }, outDelayMs);
  }, [clearTimers, disabled, outDelayMs]);

  useEffect(() => {
    if (!disabled) return;
    clearTimers();
    setHoveredIndex(null);
  }, [disabled, clearTimers]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  return { hoveredIndex, scheduleEnter, scheduleLeave };
}
