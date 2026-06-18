// 중첩 목록 파서·포맷 단위 검증
import assert from "node:assert/strict";
import {
  formatListTreeText,
  listTreesStructurallyEqual,
  parseListTreeText,
} from "../lib/edit/list-tree.ts";

function test(name, fn) {
  try {
    fn();
    console.log(`ok ${name}`);
  } catch (err) {
    console.error(`fail ${name}`);
    throw err;
  }
}

test("flat unordered", () => {
  const raw = `- one
- two`;
  const r = parseListTreeText(raw);
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(r.tree.length, 2);
  assert.equal(r.tree[0].marker, "dash");
});

test("nested mixed depth", () => {
  const raw = `1. top
  - sub
2. second
  1) a
  2) b`;
  const r = parseListTreeText(raw);
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(r.tree.length, 2);
  assert.equal(r.tree[0].children?.length, 1);
  assert.equal(r.tree[1].children?.[0].marker, "decimal-paren");
});

test("rejects ordered/unordered siblings", () => {
  const raw = `1. a
- b`;
  const r = parseListTreeText(raw);
  assert.equal(r.ok, false);
});

test("allows blank lines", () => {
  const raw = `- a

- b`;
  const r = parseListTreeText(raw);
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(r.tree.length, 2);
  assert.equal(r.tree[0].text, "a\n");
});

test("blank lines between items become br", () => {
  const raw = `* after rest



* next`;
  const r = parseListTreeText(raw);
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(r.tree[0].text, "after rest\n\n\n");
  assert.equal(r.tree[1].text, "next");
});

test("wraps continuation lines into item text", () => {
  const raw = `* A persistent sense of sadness, anxiety,
or emotional emptiness
* second`;
  const r = parseListTreeText(raw);
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(r.tree.length, 2);
  assert.match(r.tree[0].text, /anxiety,\nor emotional emptiness/);
  const out = formatListTreeText(r.tree);
  assert.match(out, /^\* A persistent/m);
  assert.match(out, /^or emotional emptiness$/m);
});

test("format preserves marker styles", () => {
  const raw = `1. one
  1) nested`;
  const r = parseListTreeText(raw);
  assert.equal(r.ok, true);
  if (!r.ok) return;
  const out = formatListTreeText(r.tree);
  assert.match(out, /^1\. one/m);
  assert.match(out, /^\s{2}1\) nested/m);
});

test("auto format unifies siblings to first marker at each depth", () => {
  const raw = `* Cognitive Behavioral Therapy (CBT): Identify unhelpful thought patterns and develop more balanced, supportive ways of thinking.
  1. Interpersonal Therapy (IPT): Explore how relationship struggles might impact your mood and learn tools for building healthier connections.
  2) asdf
  3) asd
  
- Behavioral Activation (BA): Re-engage with small, meaningful activities that help rebuild motivation, energy, and joy.
- Client-Centered Therapy: A warm, nonjudgmental space to talk openly, reflect deeply, and grow with support.
- Stress Management & Thought Restructuring: Learn how to calm your body and mind, and replace negative thought cycles with more constructive perspectives.`;
  const r = parseListTreeText(raw);
  assert.equal(r.ok, true);
  if (!r.ok) return;
  const out = formatListTreeText(r.tree);
  assert.match(out, /^\* Cognitive Behavioral Therapy/m);
  assert.match(out, /^\s{2}1\. Interpersonal Therapy/m);
  assert.match(out, /^\s{2}2\. asdf/m);
  assert.match(out, /^\s{2}3\. asd\n\n\* Behavioral Activation/m);
  assert.match(out, /^\* Client-Centered Therapy/m);
  assert.match(out, /^\* Stress Management/m);
  assert.doesNotMatch(out, /^- /m);
  assert.doesNotMatch(out, /^\s{2}2\) /m);
});

test("structure signature across locales", () => {
  const en = parseListTreeText(`1. a\n  - b`);
  const ko = parseListTreeText(`1. 가\n  - 나`);
  assert.equal(en.ok, true);
  assert.equal(ko.ok, true);
  if (!en.ok || !ko.ok) return;
  assert.ok(listTreesStructurallyEqual(en.tree, ko.tree));
});

console.log("All list-tree tests passed.");
