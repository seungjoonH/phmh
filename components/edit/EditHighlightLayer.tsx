"use client";

// 편집 가능 요소 hover·selected highlight
import { useCallback, useEffect, useRef, useState } from "react";

type HighlightBox = {
  top: number;
  left: number;
  width: number;
  height: number;
  selected: boolean;
};

function findEditableTarget(node: EventTarget | null): HTMLElement | null {
  if (!(node instanceof Element)) return null;
  const el = node.closest("[data-phmh-edit]") as HTMLElement | null;
  return el;
}

function isHoverBridge(node: EventTarget | null): boolean {
  if (!(node instanceof Element)) return false;
  return Boolean(node.closest("[data-edit-hover-bridge]"));
}

const FADE_MS = 200;
// insert bar expand(200ms) + debounce(80ms) 완료 시점에 highlight 가 뜨도록
const HOVER_IN_DELAY_MS = 280;

export function EditHighlightLayer() {
  const [highlight, setHighlight] = useState<HighlightBox | null>(null);
  const [present, setPresent] = useState(false);
  const [visible, setVisible] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeInRafRef = useRef<number | null>(null);
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingTargetRef = useRef<HTMLElement | null>(null);
  const visibleRef = useRef(false);
  const highlightRef = useRef<HighlightBox | null>(null);
  highlightRef.current = highlight;

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current !== null) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const clearFadeInRaf = useCallback(() => {
    if (fadeInRafRef.current !== null) {
      cancelAnimationFrame(fadeInRafRef.current);
      fadeInRafRef.current = null;
    }
  }, []);

  const clearShowTimer = useCallback(() => {
    if (showTimerRef.current !== null) {
      clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }
  }, []);

  const showHighlight = useCallback(
    (next: HighlightBox) => {
      clearHideTimer();
      setHighlight(next);
      setPresent(true);
      if (visibleRef.current) return;
      clearFadeInRaf();
      fadeInRafRef.current = requestAnimationFrame(() => {
        fadeInRafRef.current = null;
        visibleRef.current = true;
        setVisible(true);
      });
    },
    [clearHideTimer, clearFadeInRaf],
  );

  const hideHighlight = useCallback(() => {
    pendingTargetRef.current = null;
    clearShowTimer();
    clearFadeInRaf();
    visibleRef.current = false;
    setVisible(false);
    clearHideTimer();
    hideTimerRef.current = setTimeout(() => {
      hideTimerRef.current = null;
      setPresent(false);
      setHighlight(null);
    }, FADE_MS);
  }, [clearHideTimer, clearFadeInRaf, clearShowTimer]);

  const updateFromElement = useCallback(
    (el: HTMLElement | null, selected = false) => {
      if (!el) {
        hideHighlight();
        return;
      }
      // selected(click) 또는 이미 노출 중 상태에서 다른 element 진입 → 즉시 갱신
      if (selected || visibleRef.current) {
        pendingTargetRef.current = el;
        clearShowTimer();
        const rect = el.getBoundingClientRect();
        showHighlight({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          selected,
        });
        return;
      }
      // 새로 hover 시작 — insert bar 가 다 펼쳐진 뒤 표시되도록 delay
      if (
        pendingTargetRef.current === el &&
        showTimerRef.current !== null
      ) {
        return;
      }
      pendingTargetRef.current = el;
      clearShowTimer();
      showTimerRef.current = setTimeout(() => {
        showTimerRef.current = null;
        const target = pendingTargetRef.current;
        if (!target) return;
        const rect = target.getBoundingClientRect();
        showHighlight({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          selected: false,
        });
      }, HOVER_IN_DELAY_MS);
    },
    [hideHighlight, showHighlight, clearShowTimer],
  );

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const target = findEditableTarget(e.target);
      if (!target) {
        // 드래그 핸들/추가 bar 주변은 editable 자체가 아니지만 같은 hover 영역으로 취급한다.
        if (isHoverBridge(e.target)) return;
        if (!highlightRef.current?.selected) hideHighlight();
        return;
      }
      updateFromElement(target, false);
    };

    const onSelected = (e: Event) => {
      const detail = (e as CustomEvent<{ element: HTMLElement }>).detail;
      updateFromElement(detail.element, true);
    };

    const onClearSelected = () => {
      setHighlight((prev) => {
        if (!prev?.selected) return prev;
        return { ...prev, selected: false };
      });
    };

    const onScroll = () => {
      hideHighlight();
    };

    document.addEventListener("mousemove", onMove);
    window.addEventListener("scroll", onScroll, true);
    document.addEventListener("scroll", onScroll, true);
    window.addEventListener("phmh-edit-selected", onSelected);
    window.addEventListener("phmh-edit-panel-closed", onClearSelected);
    return () => {
      document.removeEventListener("mousemove", onMove);
      window.removeEventListener("scroll", onScroll, true);
      document.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("phmh-edit-selected", onSelected);
      window.removeEventListener("phmh-edit-panel-closed", onClearSelected);
      clearHideTimer();
      clearFadeInRaf();
      clearShowTimer();
    };
  }, [
    updateFromElement,
    hideHighlight,
    clearHideTimer,
    clearFadeInRaf,
    clearShowTimer,
  ]);

  if (!present || !highlight) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[60]" aria-hidden>
      <div
        className={`edit-highlight-box absolute rounded-sm border-2 shadow-none ${
          visible ? "edit-highlight-visible" : "edit-highlight-hidden"
        } ${highlight.selected ? "edit-highlight-selected" : "edit-highlight-hover"}`}
        style={{
          top: highlight.top - 2,
          left: highlight.left - 2,
          width: highlight.width + 4,
          height: highlight.height + 4,
        }}
      />
    </div>
  );
}
