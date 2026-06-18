// setArrayAtPath 가 중첩 배열 경로를 오염시키지 않는지 검증
import assert from "node:assert/strict";

function isArrayIndex(part) {
  return /^\d+$/.test(part);
}

function cloneChildForPath(next, followingPart) {
  if (Array.isArray(next)) return [...next];
  if (next !== null && typeof next === "object") {
    return { ...next };
  }
  return isArrayIndex(followingPart) ? [] : {};
}

function setArrayAtPath(messages, keyPath, value) {
  const parts = keyPath.split(".");
  const clone = structuredClone(messages);
  let current = clone;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    const followingPart = parts[i + 1];
    if (Array.isArray(current)) {
      if (!isArrayIndex(part)) return messages;
      const index = Number(part);
      const child = cloneChildForPath(current[index], followingPart);
      current[index] = child;
      current = child;
      continue;
    }
    const next = current[part];
    if (next === null || typeof next !== "object") {
      return messages;
    }
    const child = cloneChildForPath(next, followingPart);
    current[part] = child;
    current = child;
  }
  const leaf = parts[parts.length - 1];
  if (Array.isArray(current)) {
    if (!isArrayIndex(leaf)) return messages;
    current[Number(leaf)] = value;
  } else {
    current[leaf] = value;
  }
  return clone;
}

function sectionKeyFromListKey(listKey) {
  const flowScoped = /^(.+?)\.flow\.[a-z0-9]+\.list$/i.exec(listKey);
  if (flowScoped) return flowScoped[1];

  const subsectionList = /^(.+?)\.subsections\.\d+\.lists\.\d+$/i.exec(listKey);
  if (subsectionList) return subsectionList[1];

  const servicesSection = /^(serviceAreas|services)\.sections\.([^.]+)/.exec(listKey);
  if (servicesSection) return `${servicesSection[1]}.sections.${servicesSection[2]}`;

  const topList = /^(.+?)\.lists\.\d+$/i.exec(listKey);
  if (topList) return topList[1];

  return null;
}

const base = {
  serviceAreas: {
    sections: {
      depression: {
        title: "Depression",
        subsections: [
          {
            heading: "About",
            lists: [
              {
                items: ["item one", "item two"],
              },
            ],
          },
        ],
      },
    },
  },
};

const arrayKey = "serviceAreas.sections.depression.subsections.0.lists.0.items";
const next = setArrayAtPath(base, arrayKey, [
  "edited one",
  "edited two",
  "edited three",
]);

const subsections = next.serviceAreas.sections.depression.subsections;
assert.ok(Array.isArray(subsections), "subsections must stay an array");
assert.equal(subsections[0].lists[0].items[2], "edited three");

assert.equal(
  sectionKeyFromListKey("serviceAreas.sections.depression.subsections.0.lists.0"),
  "serviceAreas.sections.depression",
);
assert.equal(sectionKeyFromListKey("pages.whoWeAre.lists.0"), "pages.whoWeAre");

console.log("test-set-array-at-path: ok");
