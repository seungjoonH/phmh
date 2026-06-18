"use client";

// 포인터 기반 드래그 — pick 은 pointer + visual content box, shift/anchor 는 layout row
import { useCallback, useEffect, useRef, useState } from "react";
import {
  computeInsertAnchorAtSlot,
  insertAtPosToDisplayTo,
  resolveDragFrame,
  type EditDropTarget,
  type InsertAnchorBounds,
  type RowBox,
  type RowShift,
} from "@/lib/edit/reorder-drag-math";

export type { EditDropTarget, RowShift };

type DragState = {
  index: number;
  axis: "x" | "y";
  pointerStart: { x: number; y: number };
  cloneNode: HTMLElement;
  cloneStart: { left: number; top: number; width: number; height: number };
  list: HTMLElement | null;
  pointerId: number;
};

type MoveHandler = (from: number, to: number) => void | Promise<void>;

function getCurrentTranslate(el: HTMLElement): { x: number; y: number } {
  const style = window.getComputedStyle(el);
  const transform = style.transform;
  if (!transform || transform === "none") return { x: 0, y: 0 };
  const m2d = transform.match(/^matrix\(([^)]+)\)$/);
  if (m2d) {
    const parts = m2d[1].split(",").map((s) => Number(s.trim()));
    if (parts.length === 6) return { x: parts[4], y: parts[5] };
  }
  const m3d = transform.match(/^matrix3d\(([^)]+)\)$/);
  if (m3d) {
    const parts = m3d[1].split(",").map((s) => Number(s.trim()));
    if (parts.length === 16) return { x: parts[12], y: parts[13] };
  }
  return { x: 0, y: 0 };
}

function scopedReorderRows(list: HTMLElement | null): HTMLElement[] {
  if (!list) return [];
  const isMarkedList = list.hasAttribute("data-edit-reorder-list");
  const rows = Array.from(
    list.querySelectorAll<HTMLElement>("[data-edit-reorder-index]"),
  );
  return isMarkedList
    ? rows.filter(
        (r) =>
          r.closest<HTMLElement>("[data-edit-reorder-list]") === list,
      )
    : rows.filter((r) => r.parentElement === list);
}

/** row transform 을 제거한 static box — el 은 row 또는 clone-target */
function measureStaticBox(
  index: number,
  el: HTMLElement,
  row: HTMLElement,
): RowBox {
  const rect = el.getBoundingClientRect();
  const { x: tx, y: ty } = getCurrentTranslate(row);
  const top = rect.top - ty;
  const left = rect.left - tx;
  const bottom = top + rect.height;
  const right = left + rect.width;
  return {
    index,
    top,
    bottom,
    left,
    right,
    midX: (left + right) / 2,
    midY: (top + bottom) / 2,
  };
}

/** shift·anchor·drop 용 — row 전체(본문 + 컨트롤) */
function measureLayoutBoxes(list: HTMLElement | null): RowBox[] {
  const out: RowBox[] = [];
  for (const row of scopedReorderRows(list)) {
    const idxStr = row.dataset.editReorderIndex;
    if (!idxStr) continue;
    const idx = Number(idxStr);
    if (Number.isNaN(idx)) continue;
    out.push(measureStaticBox(idx, row, row));
  }
  return out;
}

/** pick 용 — clone-target 본문만(클론 중심과 같은 좌표계) */
function measurePickBoxes(list: HTMLElement | null): RowBox[] {
  const out: RowBox[] = [];
  for (const row of scopedReorderRows(list)) {
    const idxStr = row.dataset.editReorderIndex;
    if (!idxStr) continue;
    const idx = Number(idxStr);
    if (Number.isNaN(idx)) continue;
    const pickEl =
      row.querySelector<HTMLElement>("[data-edit-clone-target]") ?? row;
    out.push(measureStaticBox(idx, pickEl, row));
  }
  return out;
}

function unhideClonePlaceholders(clone: HTMLElement) {
  clone.style.background = "";
  clone.style.boxShadow = "";
  const hidden = clone.querySelectorAll<HTMLElement>("[data-edit-source-hide='true']");
  hidden.forEach((el) => {
    el.style.visibility = "visible";
  });
}

const INHERITED_FONT_PROPS = [
  "font-family",
  "font-size",
  "font-weight",
  "font-style",
  "font-variant",
  "line-height",
  "letter-spacing",
  "word-spacing",
  "text-align",
  "text-transform",
  "text-indent",
  "color",
] as const;

function copyInheritedTypography(source: HTMLElement, clone: HTMLElement) {
  const computed = window.getComputedStyle(source);
  for (const prop of INHERITED_FONT_PROPS) {
    clone.style.setProperty(prop, computed.getPropertyValue(prop));
  }
}

export function useEditReorderDrag(options?: { axis?: "x" | "y" }) {
  const axis = options?.axis ?? "y";
  const [dragIndex, setDragIndexState] = useState<number | null>(null);
  const [dropTarget, setDropTargetState] = useState<EditDropTarget | null>(null);
  const [rowShifts, setRowShiftsState] = useState<Record<number, RowShift>>({});

  const stateRef = useRef<DragState | null>(null);
  const dropTargetRef = useRef<EditDropTarget | null>(null);
  const insertToRef = useRef<number | null>(null);
  const rowShiftsRef = useRef<Record<number, RowShift>>({});
  const anchorElRef = useRef<HTMLDivElement | null>(null);
  const onMoveRef = useRef<MoveHandler | null>(null);

  const removeAnchorEl = useCallback(() => {
    anchorElRef.current?.remove();
    anchorElRef.current = null;
  }, []);

  const setInsertAnchor = useCallback((bounds: InsertAnchorBounds | null) => {
    if (!bounds) {
      if (anchorElRef.current) anchorElRef.current.style.display = "none";
      return;
    }
    let el = anchorElRef.current;
    if (!el) {
      el = document.createElement("div");
      el.setAttribute("data-edit-insert-anchor", "true");
      el.setAttribute("aria-hidden", "true");
      Object.assign(el.style, {
        position: "fixed",
        zIndex: "9998",
        pointerEvents: "none",
        borderRadius: "6px",
        boxShadow:
          "inset 0 0 0 2px color-mix(in srgb, var(--color-primary) 70%, transparent)",
        background:
          "color-mix(in srgb, var(--color-primary) 12%, transparent)",
      });
      document.body.appendChild(el);
      anchorElRef.current = el;
    }
    Object.assign(el.style, {
      display: "block",
      top: `${bounds.top}px`,
      left: `${bounds.left}px`,
      width: `${bounds.width}px`,
      height: `${bounds.height}px`,
    });
  }, []);

  const resetDragState = useCallback(() => {
    dropTargetRef.current = null;
    insertToRef.current = null;
    rowShiftsRef.current = {};
    setDragIndexState(null);
    setDropTargetState(null);
    setRowShiftsState({});
    removeAnchorEl();
    document.body.style.userSelect = "";
    document.body.style.cursor = "";
  }, [removeAnchorEl]);

  const cleanup = useCallback(() => {
    const s = stateRef.current;
    if (s) s.cloneNode.remove();
    stateRef.current = null;
    resetDragState();
  }, [resetDragState]);

  const releaseDragVisuals = useCallback(() => {
    const s = stateRef.current;
    if (s) s.cloneNode.remove();
    stateRef.current = null;
    resetDragState();
  }, [resetDragState]);

  const updateDragFrame = useCallback(
    (e: PointerEvent) => {
      const s = stateRef.current;
      if (!s) return;

      const dx = e.clientX - s.pointerStart.x;
      const dy = e.clientY - s.pointerStart.y;
      s.cloneNode.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;

      const layoutBoxes = measureLayoutBoxes(s.list);
      const pickBoxes = measurePickBoxes(s.list);
      const pointX = e.clientX;
      const pointY = e.clientY;

      const resolved = resolveDragFrame(
        pickBoxes,
        layoutBoxes,
        s.index,
        s.axis,
        pointX,
        pointY,
        rowShiftsRef.current,
      );
      if (!resolved) return;

      const { target, insertAt, shifts } = resolved;
      rowShiftsRef.current = shifts;
      insertToRef.current = insertAtPosToDisplayTo(
        layoutBoxes,
        s.index,
        insertAt,
      );
      const anchor = computeInsertAnchorAtSlot(
        layoutBoxes,
        pickBoxes,
        shifts,
        s.axis,
        insertAt,
        s.index,
      );

      dropTargetRef.current = target;
      setDropTargetState(target);
      setRowShiftsState(shifts);
      setInsertAnchor(anchor);
    },
    [setInsertAnchor],
  );

  useEffect(() => {
    if (dragIndex === null) return;

    let rafId: number | null = null;
    let lastEvent: PointerEvent | null = null;

    const applyFrame = () => {
      rafId = null;
      const e = lastEvent;
      lastEvent = null;
      if (!e) return;
      updateDragFrame(e);
    };

    const handleMove = (e: PointerEvent) => {
      lastEvent = e;
      if (rafId !== null) return;
      rafId = requestAnimationFrame(applyFrame);
    };

    const handleUp = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      const s = stateRef.current;
      const displayTo = insertToRef.current;
      const onMove = onMoveRef.current;
      if (s && displayTo !== null && onMove) {
        if (displayTo !== s.index) {
          const result = onMove(s.index, displayTo);
          void Promise.resolve(result).finally(() => {
            releaseDragVisuals();
          });
          return;
        }
      }
      cleanup();
    };

    const handleCancel = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      cleanup();
    };

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleCancel();
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleCancel);
    window.addEventListener("keydown", handleKey);
    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleCancel);
      window.removeEventListener("keydown", handleKey);
    };
  }, [dragIndex, cleanup, releaseDragVisuals, updateDragFrame]);

  const beginDrag = useCallback(
    (
      index: number,
      rowEl: HTMLElement,
      e: React.PointerEvent | PointerEvent,
    ) => {
      const cloneSource =
        rowEl.querySelector<HTMLElement>("[data-edit-clone-target]") ?? rowEl;
      const rect = cloneSource.getBoundingClientRect();
      const list =
        rowEl.closest<HTMLElement>("[data-edit-reorder-list]") ??
        rowEl.parentElement;

      const GRIP_PAD = 12;
      const gripX = e.clientX - rect.left;
      const gripY = e.clientY - rect.top;
      const cloneLeft =
        gripX < GRIP_PAD || gripX > rect.width - GRIP_PAD
          ? e.clientX - GRIP_PAD
          : rect.left;
      const cloneTop =
        gripY < GRIP_PAD || gripY > rect.height - GRIP_PAD
          ? e.clientY - GRIP_PAD
          : rect.top;

      const clone = cloneSource.cloneNode(true) as HTMLElement;
      clone.style.position = "fixed";
      clone.style.top = `${cloneTop}px`;
      clone.style.left = `${cloneLeft}px`;
      clone.style.width = `${rect.width}px`;
      clone.style.height = `${rect.height}px`;
      clone.style.margin = "0";
      clone.style.pointerEvents = "none";
      clone.style.zIndex = "9999";
      clone.style.opacity = "0.92";
      clone.style.transform = "translate3d(0,0,0)";
      clone.style.transition = "none";
      clone.style.boxShadow =
        "0 24px 56px -18px color-mix(in srgb, var(--color-primary) 55%, transparent), 0 0 0 1px color-mix(in srgb, var(--color-primary) 36%, transparent)";
      clone.style.borderRadius = "10px";
      clone.style.background = "rgb(var(--page-bg))";
      clone.style.willChange = "transform";
      clone.removeAttribute("data-edit-reorder-index");
      unhideClonePlaceholders(clone);
      copyInheritedTypography(rowEl, clone);
      document.body.appendChild(clone);

      if (e.pointerId !== undefined && e.target instanceof Element) {
        try {
          e.target.setPointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
      }

      stateRef.current = {
        index,
        axis,
        pointerStart: { x: e.clientX, y: e.clientY },
        cloneNode: clone,
        cloneStart: {
          left: cloneLeft,
          top: cloneTop,
          width: rect.width,
          height: rect.height,
        },
        list,
        pointerId: e.pointerId,
      };
      dropTargetRef.current = null;
      insertToRef.current = null;
      rowShiftsRef.current = {};

      document.body.style.userSelect = "none";
      document.body.style.cursor = "grabbing";

      setDragIndexState(index);
      setDropTargetState(null);
      setRowShiftsState({});
      setInsertAnchor(null);

      updateDragFrame(
        "nativeEvent" in e ? e.nativeEvent : (e as PointerEvent),
      );
    },
    [axis, updateDragFrame, setInsertAnchor],
  );

  const createDropHandler = useCallback(
    (onMove: MoveHandler) => {
      onMoveRef.current = onMove;
      return () => {};
    },
    [],
  );

  const getRowShift = useCallback(
    (index: number): RowShift => {
      return rowShifts[index] ?? { x: 0, y: 0 };
    },
    [rowShifts],
  );

  return {
    dragIndex,
    dropTarget,
    dragStep: 0,
    beginDrag,
    createDropHandler,
    getRowShift,
    axis,
    isDragging: dragIndex !== null,
    pickDropTarget: noop,
    setDragIndex: noop as (index: number, step?: number) => void,
    resolveInsertIndex: () => null as number | null,
  };
}

function noop() {
  /* no-op */
}
