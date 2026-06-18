// 목록 textarea Tab 들여쓰기 검증
import assert from "node:assert/strict";
import {
  indentTextareaLines,
  outdentTextareaLines,
} from "../lib/edit/list-textarea-indent.ts";

function test(name, fn) {
  try {
    fn();
    console.log(`ok ${name}`);
  } catch (err) {
    console.error(`fail ${name}`);
    throw err;
  }
}

test("single line cursor", () => {
  const r = indentTextareaLines("* item", 0, 0);
  assert.equal(r.text, "  * item");
  assert.equal(r.selectionStart, 2);
  assert.equal(r.selectionEnd, 2);
});

test("multi-line selection", () => {
  const text = "* one\nor wrap\n* two";
  const r = indentTextareaLines(text, 2, 12);
  assert.equal(r.text, "  * one\n  or wrap\n* two");
  assert.equal(r.selectionStart, 4);
  assert.equal(r.selectionEnd, 16);
});

test("full row drag selection", () => {
  const text = "* a\n* b\n* c";
  const r = indentTextareaLines(text, 0, 11);
  assert.equal(r.text, "  * a\n  * b\n  * c");
  assert.equal(r.selectionEnd, 17);
});

test("single line outdent", () => {
  const r = outdentTextareaLines("  * item", 4, 4);
  assert.equal(r.text, "* item");
  assert.equal(r.selectionStart, 2);
  assert.equal(r.selectionEnd, 2);
});

test("multi-line outdent selection", () => {
  const text = "  * one\n  or wrap\n* two";
  const r = outdentTextareaLines(text, 2, 14);
  assert.equal(r.text, "* one\nor wrap\n* two");
  assert.equal(r.selectionStart, 0);
  assert.equal(r.selectionEnd, 10);
});

test("full row drag outdent", () => {
  const text = "  * a\n  * b\n  * c";
  const r = outdentTextareaLines(text, 0, 17);
  assert.equal(r.text, "* a\n* b\n* c");
  assert.equal(r.selectionEnd, 11);
});

test("outdent skips lines without leading spaces", () => {
  const text = "* a\n  * b";
  const r = outdentTextareaLines(text, 0, 8);
  assert.equal(r.text, "* a\n* b");
});

console.log("All list-textarea-indent tests passed.");
