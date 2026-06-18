// 편집 모드 DnD — drop target 판정·row shift 시뮬레이션 순수 로직

export type EditDropTarget = {
  index: number;
  position: "before" | "after";
};

export type RowBox = {
  index: number;
  top: number;
  bottom: number;
  left: number;
  right: number;
  midX: number;
  midY: number;
};

export type RowShift = { x: number; y: number };

export function computeInsertIndex(from: number, target: EditDropTarget): number {
  let insertAt = target.index + (target.position === "after" ? 1 : 0);
  if (from < insertAt) insertAt -= 1;
  return insertAt;
}

export type InsertAnchorBounds = {
  top: number;
  left: number;
  width: number;
  height: number;
};

/** 포인터가 아직 원본 본문 box 안 — 슬롯 전환 없음 */
export function isPointerInSourceSlot(
  source: RowBox,
  pickBoxes: RowBox[],
  axis: "x" | "y",
  pointX: number,
  pointY: number,
): boolean {
  if (axis === "y") {
    return pointY >= source.top && pointY < source.bottom;
  }
  if (isGridLayout(pickBoxes, axis)) {
    return (
      pointX >= source.left &&
      pointX < source.right &&
      pointY >= source.top &&
      pointY < source.bottom
    );
  }
  return pointX >= source.left && pointX < source.right;
}

/** pickRowFor+computeInsertIndex 는 한 칸 이동 insertAt 을 못 만듦 — midY 밴드로 배열 위치 직접 계산 */
export function pickInsertAtPosition(
  pickBoxes: RowBox[],
  dragIndex: number,
  axis: "x" | "y",
  pointX: number,
  pointY: number,
  visualShifts: Record<number, RowShift> = {},
): number {
  const sorted = [...pickBoxes].sort((a, b) => a.index - b.index);
  const n = sorted.length;
  const sourcePos = sorted.findIndex((b) => b.index === dragIndex);
  const source = sorted[sourcePos];
  const visual = applyRowShiftsToBoxes(sorted, visualShifts);

  if (
    source &&
    isPointerInSourceSlot(source, pickBoxes, axis, pointX, pointY)
  ) {
    return sourcePos;
  }

  const coord = axis === "y" ? pointY : pointX;
  const mid = (b: RowBox) => (axis === "y" ? b.midY : b.midX);

  for (let pos = 0; pos < n; pos++) {
    if (coord < mid(visual[pos])) {
      return pos;
    }
  }
  return n;
}

/** measured insertAt(배열 위치) → moveFlowBlock `to`(display index) */
export function insertAtPosToDisplayTo(
  sortedBoxes: RowBox[],
  dragIndex: number,
  insertAtPos: number,
): number {
  const indices = sortedBoxes.map((b) => b.index);
  const slots = [...indices].sort((a, b) => a - b);
  const fromPos = indices.indexOf(dragIndex);
  const order = [...indices];
  const [moved] = order.splice(fromPos, 1);
  const clamped = Math.max(0, Math.min(order.length, insertAtPos));
  order.splice(clamped, 0, moved);
  const posInOrder = order.indexOf(dragIndex);
  return slots[posInOrder];
}

function insertAtPosToTarget(
  sorted: RowBox[],
  insertAtPos: number,
): EditDropTarget {
  if (sorted.length === 0) {
    return { index: 0, position: "before" };
  }
  if (insertAtPos <= 0) {
    return { index: sorted[0].index, position: "before" };
  }
  if (insertAtPos >= sorted.length) {
    return {
      index: sorted[sorted.length - 1].index,
      position: "after",
    };
  }
  return { index: sorted[insertAtPos].index, position: "before" };
}

/** 원래 자리 홈 — insertAt === sourcePos */
export function computeSourceAnchorBounds(
  pickBoxes: RowBox[],
  dragIndex: number,
  axis: "x" | "y",
): InsertAnchorBounds | null {
  const pickSource = pickBoxes.find((b) => b.index === dragIndex);
  if (!pickSource) return null;
  const width = pickSource.right - pickSource.left;
  const height = pickSource.bottom - pickSource.top;
  if (axis === "y") {
    return { top: pickSource.top, left: pickSource.left, width, height };
  }
  return { top: pickSource.top, left: pickSource.left, width, height };
}

function isGridLayout(boxes: RowBox[], axis: "x" | "y"): boolean {
  return axis === "x" && new Set(boxes.map((b) => Math.round(b.top))).size > 1;
}

function averageGap(
  sorted: RowBox[],
  axis: "x" | "y",
): number {
  const startOf = (b: RowBox) => (axis === "y" ? b.top : b.left);
  const sizeOf = (b: RowBox) =>
    axis === "y" ? b.bottom - b.top : b.right - b.left;

  let gapSum = 0;
  let gapCount = 0;
  for (let i = 1; i < sorted.length; i++) {
    gapSum += startOf(sorted[i]) - (startOf(sorted[i - 1]) + sizeOf(sorted[i - 1]));
    gapCount += 1;
  }
  return gapCount > 0 ? gapSum / gapCount : 0;
}

/** 누적 좌표 시뮬레이션 — insertAt 에 dragged item 이 놓일 layout Y/X */
export function computeDestinationStart(
  boxes: RowBox[],
  axis: "x" | "y",
  dragIndex: number,
  insertAt: number,
): number | null {
  if (boxes.length === 0) return null;
  const sorted = [...boxes].sort((a, b) => a.index - b.index);
  const sourcePos = sorted.findIndex((b) => b.index === dragIndex);
  if (sourcePos < 0) return null;

  const reordered = [...sorted];
  const [moved] = reordered.splice(sourcePos, 1);
  const clampedInsert = Math.max(0, Math.min(reordered.length, insertAt));
  reordered.splice(clampedInsert, 0, moved);

  const startOf = (b: RowBox) => (axis === "y" ? b.top : b.left);
  const sizeOf = (b: RowBox) =>
    axis === "y" ? b.bottom - b.top : b.right - b.left;
  const gap = averageGap(sorted, axis);

  let cursor = sorted.length > 0 ? startOf(sorted[0]) : 0;
  for (const b of reordered) {
    if (b.index === dragIndex) return cursor;
    cursor += sizeOf(b) + gap;
  }
  return cursor;
}

/**
 * insertAt 목적 slot — layout 누적 좌표 + clone-target 크기
 */
export function computeInsertAnchorAtSlot(
  layoutBoxes: RowBox[],
  pickBoxes: RowBox[],
  _shifts: Record<number, RowShift>,
  axis: "x" | "y",
  insertAt: number,
  dragIndex: number,
): InsertAnchorBounds | null {
  if (layoutBoxes.length === 0) return null;
  const sorted = [...layoutBoxes].sort((a, b) => a.index - b.index);
  const layoutSource = sorted.find((b) => b.index === dragIndex);
  const pickSource = pickBoxes.find((b) => b.index === dragIndex);
  if (!layoutSource) return null;

  const sourcePos = sorted.findIndex((b) => b.index === dragIndex);
  if (insertAt === sourcePos) {
    return computeSourceAnchorBounds(pickBoxes, dragIndex, axis);
  }

  const width = pickSource
    ? pickSource.right - pickSource.left
    : layoutSource.right - layoutSource.left;
  const height = pickSource
    ? pickSource.bottom - pickSource.top
    : layoutSource.bottom - layoutSource.top;
  const left = pickSource ? pickSource.left : layoutSource.left;
  const dest = computeDestinationStart(layoutBoxes, axis, dragIndex, insertAt);
  if (dest === null) return null;

  if (axis === "y") {
    return { top: dest, left, width, height };
  }
  const top = pickSource ? pickSource.top : layoutSource.top;
  return { top, left: dest, width, height };
}

/**
 * 본문 box 안 — 원래 자리 유지
 * 밖 — visual pick 으로 목적지 slot
 */
export function resolveDragFrame(
  pickBoxes: RowBox[],
  layoutBoxes: RowBox[],
  dragIndex: number,
  axis: "x" | "y",
  pointX: number,
  pointY: number,
  prevShifts: Record<number, RowShift> = {},
): {
  target: EditDropTarget;
  insertAt: number;
  shifts: Record<number, RowShift>;
} | null {
  const sorted = [...layoutBoxes].sort((a, b) => a.index - b.index);
  if (sorted.length === 0) return null;

  if (isGridLayout(pickBoxes, axis)) {
    const pickable = pickBoxes.filter((b) => b.index !== dragIndex);
    if (pickable.length === 0) return null;
    const visualFromPrev = applyRowShiftsToBoxes(pickable, prevShifts);
    let target =
      pickRowFor(visualFromPrev, pointX, pointY, axis) ??
      pickRowFor(pickable, pointX, pointY, axis);
    if (!target) return null;
    let insertAt = computeInsertIndex(dragIndex, target);
    let shifts = computeRowShifts(layoutBoxes, axis, dragIndex, insertAt);
    const visualPickable = applyRowShiftsToBoxes(pickable, shifts);
    const visualTarget = pickRowFor(visualPickable, pointX, pointY, axis);
    if (
      visualTarget &&
      (visualTarget.index !== target.index ||
        visualTarget.position !== target.position)
    ) {
      target = visualTarget;
      insertAt = computeInsertIndex(dragIndex, target);
      shifts = computeRowShifts(layoutBoxes, axis, dragIndex, insertAt);
    }
    return { target, insertAt, shifts };
  }

  const insertAt = pickInsertAtPosition(
    pickBoxes,
    dragIndex,
    axis,
    pointX,
    pointY,
    {},
  );
  const shifts = computeRowShifts(layoutBoxes, axis, dragIndex, insertAt);

  return {
    target: insertAtPosToTarget(sorted, insertAt),
    insertAt,
    shifts,
  };
}

export function applyRowShiftsToBoxes(
  boxes: RowBox[],
  shifts: Record<number, RowShift>,
): RowBox[] {
  return boxes.map((b) => {
    const shift = shifts[b.index] ?? { x: 0, y: 0 };
    const left = b.left + shift.x;
    const top = b.top + shift.y;
    const right = b.right + shift.x;
    const bottom = b.bottom + shift.y;
    return {
      index: b.index,
      left,
      top,
      right,
      bottom,
      midX: (left + right) / 2,
      midY: (top + bottom) / 2,
    };
  });
}

export function computeRowShifts(
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

  if (isGridLayout(sorted, axis)) {
    const newPosOf = new Map<number, number>();
    reordered.forEach((b, k) => newPosOf.set(b.index, k));

    const shifts: Record<number, RowShift> = {};
    for (const item of sorted) {
      if (item.index === dragIndex) {
        shifts[item.index] = { x: 0, y: 0 };
        continue;
      }
      const k = newPosOf.get(item.index) ?? 0;
      shifts[item.index] = {
        x: sorted[k].left - item.left,
        y: sorted[k].top - item.top,
      };
    }
    return shifts;
  }

  const startOf = (b: RowBox) => (axis === "y" ? b.top : b.left);
  const sizeOf = (b: RowBox) =>
    axis === "y" ? b.bottom - b.top : b.right - b.left;
  const gap = averageGap(sorted, axis);

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
    if (b.index === dragIndex) {
      shifts[b.index] = { x: 0, y: 0 };
      continue;
    }
    const o = origStart.get(b.index) ?? 0;
    const n = newStart.get(b.index) ?? 0;
    const delta = n - o;
    shifts[b.index] = axis === "y" ? { x: 0, y: delta } : { x: delta, y: 0 };
  }
  return shifts;
}

export function pickRowFor(
  boxes: RowBox[],
  pointX: number,
  pointY: number,
  axis: "x" | "y",
): EditDropTarget | null {
  if (boxes.length === 0) return null;

  const isGrid = isGridLayout(boxes, axis);

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
