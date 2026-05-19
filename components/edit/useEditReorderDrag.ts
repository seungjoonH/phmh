"use client";

// 편집 모드 블록 순서 변경 — 드래그·드롭 가이드 위치 계산
import { useCallback, useEffect, useRef, useState } from "react";

export type EditDropTarget = {
  index: number;
  position: "before" | "after";
};

function computeInsertIndex(
  dragIndex: number,
  target: EditDropTarget,
): number {
  let insertAt = target.index + (target.position === "after" ? 1 : 0);
  if (dragIndex < insertAt) insertAt -= 1;
  return insertAt;
}

export function useEditReorderDrag(options?: { axis?: "x" | "y" }) {
  const axis = options?.axis ?? "y";
  const [dragIndex, setDragIndexState] = useState<number | null>(null);
  const [dropTarget, setDropTargetState] = useState<EditDropTarget | null>(null);

  const dragIndexRef = useRef<number | null>(null);
  const dropTargetRef = useRef<EditDropTarget | null>(null);
  const dropHandledRef = useRef(false);
  const onMoveRef = useRef<((from: number, to: number) => void) | null>(null);

  const clearDrag = useCallback(() => {
    dragIndexRef.current = null;
    dropTargetRef.current = null;
    setDragIndexState(null);
    setDropTargetState(null);
  }, []);

  const setDragIndex = useCallback((index: number) => {
    dropHandledRef.current = false;
    dragIndexRef.current = index;
    setDragIndexState(index);
  }, []);

  const pickDropTarget = useCallback(
    (index: number, clientCoord: number, rect: DOMRect) => {
      if (dragIndexRef.current === null) return;
      const mid =
        axis === "y"
          ? rect.top + rect.height / 2
          : rect.left + rect.width / 2;
      const position: EditDropTarget["position"] =
        clientCoord < mid ? "before" : "after";
      const next = { index, position };
      dropTargetRef.current = next;
      setDropTargetState((prev) =>
        prev?.index === next.index && prev.position === next.position ? prev : next,
      );
    },
    [axis],
  );

  const resolveInsertIndex = useCallback((fallbackIndex: number): number | null => {
    const from = dragIndexRef.current;
    if (from === null) return null;
    const target =
      dropTargetRef.current ?? ({ index: fallbackIndex, position: "before" } as const);
    return computeInsertIndex(from, target);
  }, []);

  const createDropHandler = useCallback(
    (onMove: (from: number, to: number) => void) => {
      onMoveRef.current = onMove;
      return (targetIndex: number) => {
        const from = dragIndexRef.current;
        if (from === null) {
          clearDrag();
          return;
        }
        const insertAt = resolveInsertIndex(targetIndex);
        dropHandledRef.current = true;
        if (insertAt !== null && insertAt !== from) {
          onMove(from, insertAt);
        }
        clearDrag();
      };
    },
    [clearDrag, resolveInsertIndex],
  );

  const commitFromDragEnd = useCallback(() => {
    if (dropHandledRef.current) return;
    const from = dragIndexRef.current;
    const target = dropTargetRef.current;
    const onMove = onMoveRef.current;
    if (from === null || !target || !onMove) return;
    const insertAt = computeInsertIndex(from, target);
    if (insertAt !== from) {
      dropHandledRef.current = true;
      onMove(from, insertAt);
    }
  }, []);

  useEffect(() => {
    if (dragIndex === null) return;

    const onDragEnd = () => {
      window.setTimeout(() => {
        commitFromDragEnd();
        clearDrag();
        dropHandledRef.current = false;
      }, 0);
    };

    window.addEventListener("dragend", onDragEnd);
    return () => window.removeEventListener("dragend", onDragEnd);
  }, [dragIndex, clearDrag, commitFromDragEnd]);

  return {
    dragIndex,
    dropTarget,
    setDragIndex,
    setDropTarget: setDropTargetState,
    clearDrag,
    pickDropTarget,
    resolveInsertIndex,
    createDropHandler,
    isDragging: dragIndex !== null,
    axis,
  };
}
