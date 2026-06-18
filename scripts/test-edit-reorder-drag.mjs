// edit reorder drag 순수 로직 단위 검증
import assert from "node:assert/strict";
import {
  computeDestinationStart,
  computeInsertAnchorAtSlot,
  computeInsertIndex,
  computeRowShifts,
  insertAtPosToDisplayTo,
  pickInsertAtPosition,
  pickRowFor,
  resolveDragFrame,
} from "../lib/edit/reorder-drag-math.ts";

function test(name, fn) {
  try {
    fn();
    console.log(`ok ${name}`);
  } catch (err) {
    console.error(`fail ${name}`);
    throw err;
  }
}

function box(index, top, height, left = 0, width = 100) {
  const bottom = top + height;
  const right = left + width;
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

test("computeInsertIndex adjusts when from < insertAt", () => {
  assert.equal(computeInsertIndex(1, { index: 3, position: "before" }), 2);
  assert.equal(computeInsertIndex(1, { index: 2, position: "after" }), 2);
  assert.equal(computeInsertIndex(3, { index: 0, position: "before" }), 0);
});

test("equal height 3 rows: move index 0 to insertAt 2", () => {
  const boxes = [box(0, 0, 100), box(1, 140, 100), box(2, 280, 100)];
  const shifts = computeRowShifts(boxes, "y", 0, 2);
  assert.equal(shifts[0].y, 0);
  assert.equal(shifts[1].y, -140);
  assert.equal(shifts[2].y, -140);
});

test("variable heights: cumulative shift uses average gap", () => {
  const boxes = [box(0, 0, 120), box(1, 160, 60), box(2, 275, 200)];
  const shifts = computeRowShifts(boxes, "y", 2, 0);
  assert.deepEqual(shifts[2], { x: 0, y: 0 });
  assert.equal(boxes[0].top + shifts[0].y, 247.5);
});

test("source row shift is always zero", () => {
  const boxes = [box(0, 0, 80), box(1, 120, 80), box(2, 240, 80)];
  const shifts = computeRowShifts(boxes, "y", 1, 0);
  assert.deepEqual(shifts[1], { x: 0, y: 0 });
});

test("pick at pointer Y not biased by tall content center", () => {
  const row = box(1, 300, 100);
  const atHandle = pickRowFor([row], 50, 310, "y");
  const atContentCenter = pickRowFor([row], 50, 350, "y");
  assert.equal(atHandle?.position, "before");
  assert.equal(atContentCenter?.position, "after");
});

test("pick midY uses content box not taller layout row", () => {
  const layoutBox = box(1, 160, 120);
  const pickBox = box(1, 160, 80);
  const layoutTarget = pickRowFor([layoutBox], 50, 210, "y");
  const pickTarget = pickRowFor([pickBox], 50, 210, "y");
  assert.equal(layoutTarget?.position, "before");
  assert.equal(pickTarget?.position, "after");
});

test("grid axis=x multi-row cell exchange", () => {
  const boxes = [
    box(0, 0, 80, 0, 100),
    box(1, 0, 80, 120, 100),
    box(2, 100, 80, 0, 100),
    box(3, 100, 80, 120, 100),
  ];
  const shifts = computeRowShifts(boxes, "x", 0, 1);
  assert.equal(shifts[0].x, 0);
  assert.equal(shifts[0].y, 0);
  assert.equal(shifts[1].x, -120);
  assert.equal(shifts[1].y, 0);
});

test("anchor at cumulative destination slot", () => {
  const boxes = [box(0, 0, 100), box(1, 140, 100), box(2, 280, 100)];
  const shifts = computeRowShifts(boxes, "y", 0, 2);
  const dest = computeDestinationStart(boxes, "y", 0, 2);
  const anchor = computeInsertAnchorAtSlot(boxes, boxes, shifts, "y", 2, 0);
  assert.equal(dest, 280);
  assert.equal(anchor?.top, 280);
});

test("anchor at source slot when insertAt unchanged", () => {
  const boxes = [box(0, 0, 100), box(1, 140, 100)];
  const anchor = computeInsertAnchorAtSlot(boxes, boxes, {}, "y", 0, 0);
  assert.equal(anchor?.top, 0);
  assert.equal(anchor?.height, 100);
});

test("pointer inside source box keeps source insertAt", () => {
  const boxes = [box(0, 0, 100), box(1, 140, 100), box(2, 280, 100)];
  const atGrab = resolveDragFrame(boxes, boxes, 1, "y", 50, 145);
  assert.equal(atGrab?.insertAt, 1);
  assert.equal(atGrab?.shifts[0].y, 0);
  assert.equal(atGrab?.shifts[2].y, 0);
  const anchor = computeInsertAnchorAtSlot(
    boxes,
    boxes,
    atGrab?.shifts ?? {},
    "y",
    1,
    1,
  );
  assert.equal(anchor?.top, 140);
});

test("one slot down uses insertAt+1 not skip", () => {
  const boxes = [box(2, 0, 100), box(3, 140, 100), box(4, 280, 100), box(5, 420, 100)];
  const insertAt = pickInsertAtPosition(boxes, 3, "y", 50, 250);
  assert.equal(insertAt, 2);
  assert.equal(insertAtPosToDisplayTo(boxes, 3, insertAt), 4);
  const oldPick = computeInsertIndex(3, { index: 4, position: "before" });
  assert.equal(oldPick, 3);
});

test("pointer below source box picks one slot down", () => {
  const boxes = [box(0, 0, 100), box(1, 140, 100), box(2, 280, 100)];
  const below = resolveDragFrame(boxes, boxes, 1, "y", 50, 250);
  assert.equal(below?.insertAt, 2);
  assert.equal(insertAtPosToDisplayTo(boxes, 1, below?.insertAt ?? 0), 2);
});

test("resolveDragFrame returns shifts", () => {
  const boxes = [box(0, 0, 100), box(1, 140, 100), box(2, 280, 100)];
  const resolved = resolveDragFrame(boxes, boxes, 0, "y", 50, 310);
  assert.equal(resolved?.insertAt, 2);
  assert.equal(resolved?.shifts[1].y, -140);
});

console.log("All edit-reorder-drag tests passed.");
