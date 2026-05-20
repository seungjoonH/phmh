// text-edit-history — undo/redo 스택 검증 (인라인)
import assert from "node:assert/strict";

function clone(v) {
  return { ...v };
}

function create() {
  return { past: [], future: [] };
}

function push(h, snap) {
  h.past.push(clone(snap));
  h.future = [];
}

function undo(h, cur) {
  const prev = h.past.pop();
  if (!prev) return null;
  h.future.unshift(clone(cur));
  return prev;
}

function redo(h, cur) {
  const next = h.future.shift();
  if (!next) return null;
  h.past.push(clone(cur));
  return next;
}

const h = create();
push(h, { ko: "a" });
assert.equal(undo(h, { ko: "b" }).ko, "a");
assert.equal(redo(h, { ko: "a" }).ko, "b");

console.log("test-text-edit-history: ok");
