// pending-keys — 순서 변경 시 인덱스별 dirty 판별 검증 (인라인)
import assert from "node:assert/strict";

function getSteps(messages, arrayKey) {
  const parts = arrayKey.split(".");
  let cur = messages;
  for (const p of parts) cur = cur?.[p];
  return Array.isArray(cur) ? cur : [];
}

function getStepField(messages, key) {
  const m = /^(.+)\.(\d+)\.(title|description)$/.exec(key);
  if (!m) return "";
  const steps = getSteps(messages, m[1]);
  return steps[Number(m[2])]?.[m[3]] ?? "";
}

function isPending(key, committed, display) {
  return getStepField(committed, key) !== getStepField(display, key);
}

const committed = {
  pages: {
    gettingStarted: {
      steps: [
        { number: "01", title: "A", description: "a" },
        { number: "02", title: "B", description: "b" },
        { number: "03", title: "C", description: "c" },
        { number: "04", title: "D", description: "d" },
      ],
    },
  },
};

const display = {
  pages: {
    gettingStarted: {
      steps: [
        { number: "01", title: "B", description: "b" },
        { number: "02", title: "A", description: "a" },
        { number: "03", title: "C", description: "c" },
        { number: "04", title: "D", description: "d" },
      ],
    },
  },
};

const prefix = "pages.gettingStarted.steps";
assert.equal(isPending(`${prefix}.0.title`, committed, display), true);
assert.equal(isPending(`${prefix}.1.title`, committed, display), true);
assert.equal(isPending(`${prefix}.2.title`, committed, display), false);
assert.equal(isPending(`${prefix}.3.title`, committed, display), false);
assert.equal(isPending(`${prefix}.0.title`, committed, committed), false);

console.log("test-pending-keys: ok");
