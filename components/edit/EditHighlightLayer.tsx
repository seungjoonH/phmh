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

const FADE_MS = 200;

export function EditHighlightLayer() {
  const [highlight, setHighlight] = useState<HighlightBox | null>(null);
  const [present, setPresent] = useState(false);
  const [visible, setVisible] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeInRafRef = useRef<number | null>(null);
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
    clearFadeInRaf();
    visibleRef.current = false;
    setVisible(false);
    clearHideTimer();
    hideTimerRef.current = setTimeout(() => {
      hideTimerRef.current = null;
      setPresent(false);
      setHighlight(null);
    }, FADE_MS);
  }, [clearHideTimer, clearFadeInRaf]);

  const updateFromElement = useCallback(
    (el: HTMLElement | null, selected = false) => {
      if (!el) {
        hideHighlight();
        return;
      }
      const rect = el.getBoundingClientRect();
      showHighlight({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        selected,
      });
    },
    [hideHighlight, showHighlight],
  );

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const target = findEditableTarget(e.target);
      if (!target) {
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
      if (!highlightRef.current?.selected) hideHighlight();
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
    };
  }, [updateFromElement, hideHighlight, clearHideTimer, clearFadeInRaf]);

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
