// inline-markup-edit 단위 검증
import assert from "node:assert/strict";
import { toggleInlineMarkup } from "../lib/edit/inline-markup-edit.ts";

function test(name, fn) {
  try {
    fn();
    console.log(`ok ${name}`);
  } catch (err) {
    console.error(`fail ${name}`);
    throw err;
  }
}

test("wraps selection with bold", () => {
  const r = toggleInlineMarkup("hello world", 6, 11, "bold");
  assert.equal(r.text, "hello **world**");
  assert.equal(r.selectionStart, 8);
  assert.equal(r.selectionEnd, 13);
});

test("unwraps bold", () => {
  const r = toggleInlineMarkup("hello **world**", 8, 13, "bold");
  assert.equal(r.text, "hello world");
  assert.equal(r.selectionStart, 6);
  assert.equal(r.selectionEnd, 11);
});

test("wraps selection with italic", () => {
  const r = toggleInlineMarkup("abc", 0, 3, "italic");
  assert.equal(r.text, "*abc*");
});

test("unwraps italic", () => {
  const r = toggleInlineMarkup("*abc*", 1, 4, "italic");
  assert.equal(r.text, "abc");
});

test("empty selection inserts markers", () => {
  const r = toggleInlineMarkup("hi", 2, 2, "bold");
  assert.equal(r.text, "hi****");
  assert.equal(r.selectionStart, 4);
  assert.equal(r.selectionEnd, 4);
});

console.log("All inline-markup-edit tests passed.");
