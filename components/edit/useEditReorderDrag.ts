"use client";

// 포인터 기반 드래그 — 클론이 마우스를 따라가고, 원본 자리는 primary tint placeholder
import { useCallback, useEffect, useRef, useState } from "react";

export type EditDropTarget = {
  index: number;
  position: "before" | "after";
};

function computeInsertIndex(from: number, target: EditDropTarget): number {
  let insertAt = target.index + (target.position === "after" ? 1 : 0);
  if (from < insertAt) insertAt -= 1;
  return insertAt;
}

type RowBox = {
  index: number;
  top: number;
  bottom: number;
  left: number;
  right: number;
  midX: number;
  midY: number;
};

type DragState = {
  index: number;
  axis: "x" | "y";
  pointerStart: { x: number; y: number };
  cloneNode: HTMLElement;
  /** 클론 박스의 시작 viewport 좌표/크기 — drop 좌표 계산 시 cursor 가 아니라 클론 중심을 기준점으로 사용. */
  cloneStart: { left: number; top: number; width: number; height: number };
  /**
   * drag 시작 시점에 캐시한 list 컨테이너(`data-edit-reorder-list`) — 매 프레임 이 안에서
   * 같은 scope 의 row 를 다시 측정. nested list 의 row 는 격리됨.
   * attribute 가 없는 사용처는 row 의 직속 부모 사용.
   */
  list: HTMLElement | null;
};

type MoveHandler = (from: number, to: number) => void | Promise<void>;

/**
 * row element 에 현재 적용 중인 transform translate offset 을 추출.
 * inline style 이 아니라 getComputedStyle 의 matrix 를 사용 — CSS transition 으로
 * 보간 중인 값까지 정확히 반영되므로, getBoundingClientRect() 가 돌려주는 시각적 rect 와
 * 일치한다.
 */
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

/**
 * list scope 안의 모든 row 의 "원래 layout 박스(viewport 기준)" 를 측정.
 * row 의 현재 transform shift 는 빼서 정적 grid 형태로 만든다.
 * 좌표는 viewport(clientX/Y) 기준이라 어떤 scroll container 안에 있어도 마우스 좌표와 직접 비교 가능.
 *
 * list 가 `data-edit-reorder-list` 이면 그 안의 모든 row 를 수집하되, nested list 의 row 는
 * 자기 list 의 closest list 가 아닌 경우 제외 — nested 가 격리된다.
 */
function measureRowBoxes(list: HTMLElement | null): RowBox[] {
  if (!list) return [];
  const isMarkedList = list.hasAttribute("data-edit-reorder-list");
  const rows = Array.from(
    list.querySelectorAll<HTMLElement>("[data-edit-reorder-index]"),
  );
  const scoped = isMarkedList
    ? rows.filter(
        (r) =>
          r.closest<HTMLElement>("[data-edit-reorder-list]") === list,
      )
    : rows.filter((r) => r.parentElement === list);
  const out: RowBox[] = [];
  for (const row of scoped) {
    const idxStr = row.dataset.editReorderIndex;
    if (!idxStr) continue;
    const idx = Number(idxStr);
    if (Number.isNaN(idx)) continue;
    const rect = row.getBoundingClientRect();
    const { x: tx, y: ty } = getCurrentTranslate(row);
    const top = rect.top - ty;
    const left = rect.left - tx;
    const bottom = top + rect.height;
    const right = left + rect.width;
    out.push({
      index: idx,
      top,
      bottom,
      left,
      right,
      midX: (left + right) / 2,
      midY: (top + bottom) / 2,
    });
  }
  return out;
}

export type RowShift = { x: number; y: number };

/**
 * 모든 row 의 정확한 height/width 를 반영한 shift 시뮬레이션.
 *
 * 1D(axis="y" 또는 단일 행의 axis="x") 에서는 누적 좌표 시뮬레이션 — 각 row 의
 * 실제 size 를 반영해 원래 자리 ↔ 새 자리 delta 를 계산.
 *
 * Grid(axis="x" 이면서 다중 행) 에서는 cell 교환 — sorted index 순서대로 cell 의
 * (top,left) 가 결정되므로, 재배열 후 새 sorted position 의 cell 좌표로 이동시키면
 * 시각적으로 row-major flow 가 재정렬된 모습이 된다.
 */
function computeRowShifts(
  boxes: RowBox[],
  axis: "x" | "y",
  dragIndex: number,
  insertAt: number,
): Record<number, RowShift> {
  if (boxes.length === 0) return {};

  const sorted = [...boxes].sort((a, b) => a.index - b.index);
  const sourcePos = sorted.findIndex((b) => b.index === dragIndex);
  if (sourcePos < 0) return {};

  const reordered = [...sorted];
  const [moved] = reordered.splice(sourcePos, 1);
  const clampedInsert = Math.max(0, Math.min(reordered.length, insertAt));
  reordered.splice(clampedInsert, 0, moved);

  const isGrid =
    axis === "x" &&
    new Set(sorted.map((b) => Math.round(b.top))).size > 1;

  if (isGrid) {
    // grid cell 의 (top,left) 는 row-major flow 의 sorted position 에 의해 결정됨.
    // 재배열 후 각 item 이 가야 할 position k 의 sorted[k] 좌표로 이동.
    const newPosOf = new Map<number, number>();
    reordered.forEach((b, k) => newPosOf.set(b.index, k));

    const shifts: Record<number, RowShift> = {};
    for (let i = 0; i < sorted.length; i++) {
      const item = sorted[i];
      const k = newPosOf.get(item.index) ?? i;
      shifts[item.index] = {
        x: sorted[k].left - sorted[i].left,
        y: sorted[k].top - sorted[i].top,
      };
    }
    return shifts;
  }

  // 1D 누적 좌표 시뮬레이션
  const sizeOf = (b: RowBox) =>
    axis === "y" ? b.bottom - b.top : b.right - b.left;
  const startOf = (b: RowBox) => (axis === "y" ? b.top : b.left);

  let gapSum = 0;
  let gapCount = 0;
  for (let i = 1; i < sorted.length; i++) {
    const g = startOf(sorted[i]) - (startOf(sorted[i - 1]) + sizeOf(sorted[i - 1]));
    gapSum += g;
    gapCount += 1;
  }
  const gap = gapCount > 0 ? gapSum / gapCount : 0;

  const origStart = new Map<number, number>();
  for (const b of sorted) origStart.set(b.index, startOf(b));

  const newStart = new Map<number, number>();
  let cursor = sorted.length > 0 ? startOf(sorted[0]) : 0;
  for (const b of reordered) {
    newStart.set(b.index, cursor);
    cursor += sizeOf(b) + gap;
  }

  const shifts: Record<number, RowShift> = {};
  for (const b of sorted) {
    const o = origStart.get(b.index) ?? 0;
    const n = newStart.get(b.index) ?? 0;
    const delta = n - o;
    shifts[b.index] = axis === "y" ? { x: 0, y: delta } : { x: delta, y: 0 };
  }
  return shifts;
}

function pickRowFor(
  boxes: RowBox[],
  pointX: number,
  pointY: number,
  axis: "x" | "y",
): EditDropTarget | null {
  if (boxes.length === 0) return null;
  // grid(axis="x" 다중 행) 만 양축 box 검사. 1D 리스트는 주축만 보고 직교축은 무시 —
  // 핸들이 row 바깥에 있는 사이드바처럼 좁은 row 에서도 정확히 잡힌다.
  const isGrid =
    axis === "x" && new Set(boxes.map((b) => Math.round(b.top))).size > 1;

  // 1) 기준점이 어느 row 박스 내부에 있다면 그 row 선택
  for (const a of boxes) {
    const inside = isGrid
      ? pointX >= a.left && pointX < a.right && pointY >= a.top && pointY < a.bottom
      : axis === "y"
        ? pointY >= a.top && pointY < a.bottom
        : pointX >= a.left && pointX < a.right;
    if (inside) {
      const position: EditDropTarget["position"] =
        axis === "y"
          ? pointY < a.midY
            ? "before"
            : "after"
          : pointX < a.midX
            ? "before"
            : "after";
      return { index: a.index, position };
    }
  }
  // 2) fallback — 가장 가까운 row 선택 (list 위/아래로 빠졌을 때)
  let best: RowBox | null = null;
  let bestDist = Infinity;
  for (const a of boxes) {
    const dx = Math.max(a.left - pointX, 0, pointX - a.right);
    const dy = Math.max(a.top - pointY, 0, pointY - a.bottom);
    const dist = dx * dx + dy * dy;
    if (dist < bestDist) {
      bestDist = dist;
      best = a;
    }
  }
  if (!best) return null;
  const position: EditDropTarget["position"] =
    axis === "y"
      ? pointY < best.midY
        ? "before"
        : "after"
      : pointX < best.midX
        ? "before"
        : "after";
  return { index: best.index, position };
}

/** 드래그 클론을 만들 때 visibility:hidden 자식들을 강제로 visible 처리 */
function unhideClonePlaceholders(clone: HTMLElement) {
  // 자기 자신: bg/ring 제거 (원본은 placeholder 역할, 클론은 실제 모습)
  clone.style.background = "";
  clone.style.boxShadow = "";
  // 내부 placeholder 처리 자식 visible
  const hidden = clone.querySelectorAll<HTMLElement>("[data-edit-source-hide='true']");
  hidden.forEach((el) => {
    el.style.visibility = "visible";
  });
}

/**
 * body 에 떼어낸 clone 은 부모 cascading 을 잃어서
 * 상속 typography(폰트, 크기, 줄간격 등)가 깨지므로 명시적으로 복사한다.
 */
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
  const onMoveRef = useRef<MoveHandler | null>(null);

  const cleanup = useCallback(() => {
    const s = stateRef.current;
    if (s) s.cloneNode.remove();
    stateRef.current = null;
    dropTargetRef.current = null;
    setDragIndexState(null);
    setDropTargetState(null);
    setRowShiftsState({});
    document.body.style.userSelect = "";
    document.body.style.cursor = "";
  }, []);

  const releaseDragVisuals = useCallback(() => {
    const s = stateRef.current;
    if (s) s.cloneNode.remove();
    stateRef.current = null;
    dropTargetRef.current = null;
    setDragIndexState(null);
    setDropTargetState(null);
    document.body.style.userSelect = "";
    document.body.style.cursor = "";
  }, []);

  useEffect(() => {
    if (dragIndex === null) return;

    let rafId: number | null = null;
    let lastEvent: PointerEvent | null = null;

    const applyFrame = () => {
      rafId = null;
      const e = lastEvent;
      lastEvent = null;
      if (!e) return;
      const s = stateRef.current;
      if (!s) return;

      const dx = e.clientX - s.pointerStart.x;
      const dy = e.clientY - s.pointerStart.y;
      s.cloneNode.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;

      // 매 프레임에 row 의 원래 layout 박스를 재측정 (transform shift 제거)
      // — 어떤 scroll container 안이든 viewport 기준이라 좌표가 일관됨.
      const allBoxes = measureRowBoxes(s.list);
      // drop target pick 시 source 자기 박스는 제외 — 마우스가 자기 자리에 있을 때 self 로 잡혀
      // row shift 가 0 이 되는 케이스 방지.
      const pickable = allBoxes.filter((b) => b.index !== s.index);
      // anchor 기준점은 cursor 가 아니라 "현재 보이는 클론의 중심" — 핸들이 카드 바깥에 있어
      // cursor 와 클론이 떨어진 사용처(사이드바 등)에서 시각적 카드 위치와 drop 표시가 일치한다.
      const pointX = s.cloneStart.left + s.cloneStart.width / 2 + dx;
      const pointY = s.cloneStart.top + s.cloneStart.height / 2 + dy;
      const next = pickRowFor(pickable, pointX, pointY, s.axis);
      if (!next) return;
      const cur = dropTargetRef.current;
      if (cur && cur.index === next.index && cur.position === next.position) {
        return;
      }
      dropTargetRef.current = next;
      setDropTargetState(next);

      // 정확한 row shift 시뮬레이션 — 각 row 의 실제 height 반영.
      // allBoxes 는 source 포함이라 source 의 shift 도 계산 가능.
      const insertAt = computeInsertIndex(s.index, next);
      setRowShiftsState(computeRowShifts(allBoxes, s.axis, s.index, insertAt));
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
      const target = dropTargetRef.current;
      const onMove = onMoveRef.current;
      if (s && target && onMove) {
        const insertAt = computeInsertIndex(s.index, target);
        if (insertAt !== s.index) {
          // 실제 배열 순서가 바뀌기 전까지 clone/placeholder/preview shift 를 유지한다.
          // reorder 후에는 DOM layout 자체가 최종 위치이므로 old-index 기반 shift 를
          // 한 번에 비워 새 index 카드에 잘못 재적용되는 튐을 막는다.
          const result = onMove(s.index, insertAt);
          void Promise.resolve(result).finally(() => {
            releaseDragVisuals();
            setRowShiftsState({});
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
  }, [dragIndex, cleanup, releaseDragVisuals]);

  const beginDrag = useCallback(
    (
      index: number,
      rowEl: HTMLElement,
      e: React.PointerEvent | PointerEvent,
    ) => {
      // clone 은 row 전체가 아니라 "카드 영역" 만 — controls/handle/gap 없이 카드 자체 visual 크기.
      // data-edit-clone-target 이 없는 사용처(예: SitePagesPanel ReorderRow)는 row 전체를 clone.
      const cloneSource =
        rowEl.querySelector<HTMLElement>("[data-edit-clone-target]") ?? rowEl;
      const rect = cloneSource.getBoundingClientRect();
      // list scope 캐시 — `data-edit-reorder-list` 가 있는 가장 가까운 ancestor.
      // 없으면 row 의 직속 부모 사용 (구버전 사용처 호환).
      const list =
        rowEl.closest<HTMLElement>("[data-edit-reorder-list]") ??
        rowEl.parentElement;

      // 핸들이 카드 왼쪽 바깥(-left-9 등)에 있는 사용처에서 cursor가 clone 영역 밖에 잡히면
      // clone이 cursor 오른쪽으로 떠올라 anchor가 어색해진다.
      // grip이 clone 바깥이면 cursor를 clone 안쪽 GRIP_PAD 위치로 당긴다.
      const GRIP_PAD = 12;
      const gripX = e.clientX - rect.left;
      const gripY = e.clientY - rect.top;
      const cloneLeft =
        gripX < GRIP_PAD || gripX > rect.width - GRIP_PAD
          ? e.clientX - GRIP_PAD
          : rect.left;
      const cloneTop =
        gripY < GRIP_PAD || gripY > rect.height - GRIP_PAD
          ? e.clientY - Math.min(rect.height / 2, 24)
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
      clone.style.opacity = "1";
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
      };
      dropTargetRef.current = null;

      document.body.style.userSelect = "none";
      document.body.style.cursor = "grabbing";

      setDragIndexState(index);
      setDropTargetState(null);
      setRowShiftsState({});
    },
    [axis],
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
    // backward-compat noops (사용처 점진적 마이그레이션용)
    pickDropTarget: noop,
    setDragIndex: noop as (index: number, step?: number) => void,
    resolveInsertIndex: () => null as number | null,
  };
}

function noop() {
  /* no-op */
}
