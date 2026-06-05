// locales/*.js dot-path 문자열 패치 유틸
/**
 * @param {string} value
 */
export function escapeJsString(value) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");
}

/** locales/content 등 따옴표 없는 객체 키 지원 */
function keyInSourcePattern(key) {
  const esc = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return `(?:${esc}|"${esc}")`;
}

/**
 * @param {string} source
 * @param {number} quoteIndex index of opening "
 */
function readJsStringLiteral(source, quoteIndex) {
  let i = quoteIndex + 1;
  let raw = "";
  while (i < source.length) {
    const ch = source[i];
    if (ch === "\\") {
      const next = source[i + 1];
      if (next === "n") raw += "\n";
      else if (next === "r") raw += "\r";
      else if (next === "t") raw += "\t";
      else if (next === '"') raw += '"';
      else if (next === "\\") raw += "\\";
      else raw += next ?? "";
      i += 2;
      continue;
    }
    if (ch === '"') {
      return { value: raw, endIndex: i };
    }
    raw += ch;
    i += 1;
  }
  throw new Error("Unterminated string literal");
}

/**
 * @param {string} source
 * @param {string[]} parentKeys
 */
function findScopeStart(source, parentKeys) {
  let searchFrom = 0;
  for (const key of parentKeys) {
    const re = new RegExp(`${keyInSourcePattern(key)}\\s*:\\s*\\{`);
    const slice = source.slice(searchFrom);
    const match = re.exec(slice);
    if (!match) {
      throw new Error(`Object key not found: ${key}`);
    }
    searchFrom += match.index + match[0].length;
  }
  return searchFrom;
}

/**
 * @param {string} source
 * @param {number} arrayStart index right after `[`
 * @param {number} index
 */
function findObjectInArrayAt(source, arrayStart, index) {
  let cursor = arrayStart;
  let found = 0;
  while (cursor < source.length) {
    const ch = source[cursor];
    if (ch === "]") {
      throw new Error(`Array object index ${index} not found`);
    }
    if (ch === "{") {
      // { 다음 위치를 반환 — findScopeStart처럼 { 이후 내용부터 탐색 시작
      if (found === index) return cursor + 1;
      cursor += 1;
      let depth = 1;
      while (cursor < source.length && depth > 0) {
        if (source[cursor] === "{") depth += 1;
        else if (source[cursor] === "}") depth -= 1;
        cursor += 1;
      }
      found += 1;
      continue;
    }
    cursor += 1;
  }
  throw new Error(`Array object index ${index} not found`);
}

/**
 * 객체·배열 혼합 경로 (예: pages.gettingStarted.steps.0)
 * @param {string} source
 * @param {string[]} parentKeys
 */
function findScopeStartForPath(source, parentKeys) {
  let searchFrom = 0;
  for (let i = 0; i < parentKeys.length; i++) {
    const key = parentKeys[i];
    if (/^\d+$/.test(key)) {
      searchFrom = findObjectInArrayAt(source, searchFrom, Number(key));
      continue;
    }
    const next = parentKeys[i + 1];
    if (next !== undefined && /^\d+$/.test(next)) {
      const re = new RegExp(`${keyInSourcePattern(key)}\\s*:\\s*\\[`);
      const match = re.exec(source.slice(searchFrom));
      if (!match) {
        throw new Error(`Array key not found: ${key}`);
      }
      searchFrom += match.index + match[0].length;
      continue;
    }
    const re = new RegExp(`${keyInSourcePattern(key)}\\s*:\\s*\\{`);
    const match = re.exec(source.slice(searchFrom));
    if (!match) {
      throw new Error(`Object key not found: ${key}`);
    }
    searchFrom += match.index + match[0].length;
  }
  return searchFrom;
}

function resolveScopeStart(source, parentKeys) {
  if (parentKeys.some((key) => /^\d+$/.test(key))) {
    return findScopeStartForPath(source, parentKeys);
  }
  return findScopeStart(source, parentKeys);
}

/**
 * 객체 본문에서 최상위(직계) 프로퍼티 배열만 찾는다. flowText 안의 lists 등 중첩 키는 무시.
 * @param {string} source
 * @param {string[]} parentKeys e.g. ["pages","whoWeAre"]
 * @param {string} arrayKey e.g. lists, paragraphs
 * @returns {number | null} `[` index
 */
function findTopLevelArrayKeyBracketIndex(source, parentKeys, arrayKey) {
  const scopeStart = parentKeys.length ? resolveScopeStart(source, parentKeys) : 0;
  if (scopeStart <= 0 || source[scopeStart - 1] !== "{") {
    return null;
  }
  const bodyClose = findClosingBrace(source, scopeStart);
  const scope = source.slice(scopeStart, bodyClose);
  const keyRe = new RegExp(`${keyInSourcePattern(arrayKey)}\\s*:\\s*\\[`, "g");
  let match;
  while ((match = keyRe.exec(scope)) !== null) {
    const before = scope.slice(0, match.index);
    let depth = 0;
    for (let i = 0; i < before.length; i++) {
      const ch = before[i];
      if (ch === "{") depth += 1;
      else if (ch === "}") depth -= 1;
    }
    if (depth === 0) {
      return scopeStart + match.index + match[0].length - 1;
    }
  }
  return null;
}

/**
 * 섹션 객체에서 최상위 `arrayKey: [...]` 프로퍼티를 모두 제거 (중복 flow 등)
 * @param {string} source
 * @param {string[]} parentKeys
 * @param {string} arrayKey
 */
function removeAllTopLevelArrayProperties(source, parentKeys, arrayKey) {
  let next = source;
  while (true) {
    const bracketIndex = findTopLevelArrayKeyBracketIndex(next, parentKeys, arrayKey);
    if (bracketIndex === null) break;

    const scopeStart = parentKeys.length ? resolveScopeStart(next, parentKeys) : 0;
    const bodyClose = findClosingBrace(next, scopeStart);
    const scope = next.slice(scopeStart, bodyClose);
    const relBracket = bracketIndex - scopeStart;
    const keyRe = new RegExp(`${keyInSourcePattern(arrayKey)}\\s*:\\s*\\[`, "g");
    let propMatch = null;
    let m;
    while ((m = keyRe.exec(scope)) !== null) {
      if (m.index + m[0].length - 1 === relBracket) {
        propMatch = m;
        break;
      }
    }
    if (!propMatch) break;

    let removeStart = scopeStart + propMatch.index;
    while (removeStart > scopeStart && /[ \t]/.test(next[removeStart - 1])) {
      removeStart -= 1;
    }
    if (removeStart > scopeStart && next[removeStart - 1] === ",") {
      removeStart -= 1;
    }

    let depth = 0;
    let endBracket = bracketIndex;
    for (let i = bracketIndex; i < next.length; i++) {
      const ch = next[i];
      if (ch === "[") depth += 1;
      else if (ch === "]") {
        depth -= 1;
        if (depth === 0) {
          endBracket = i;
          break;
        }
      }
    }
    let removeEnd = endBracket + 1;
    while (removeEnd < next.length && /[ \t]/.test(next[removeEnd])) {
      removeEnd += 1;
    }
    if (next[removeEnd] === ",") {
      removeEnd += 1;
      while (removeEnd < next.length && /[ \t]/.test(next[removeEnd])) {
        removeEnd += 1;
      }
    }
    if (next[removeEnd] === "\n") removeEnd += 1;

    next = `${next.slice(0, removeStart)}${next.slice(removeEnd)}`;
  }
  return next;
}

/**
 * @param {string} source
 * @param {number} openBraceIndex index right after `{`
 */
function findClosingBrace(source, openBraceIndex) {
  let depth = 1;
  let i = openBraceIndex;
  while (i < source.length) {
    const ch = source[i];
    if (ch === '"' || ch === "'") {
      const quote = ch;
      i += 1;
      while (i < source.length) {
        if (source[i] === "\\") {
          i += 2;
          continue;
        }
        if (source[i] === quote) {
          i += 1;
          break;
        }
        i += 1;
      }
      continue;
    }
    if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth === 0) return i;
    }
    i += 1;
  }
  throw new Error("Unclosed object");
}

/** 객체 본문 끝에 프로퍼티 추가할 때 선행 쉼표 (이미 `,` 로 끝나면 생략) */
function commaBeforeObjectInsert(source, bodyStart, bodyClose) {
  const trimmed = source.slice(bodyStart, bodyClose).trimEnd();
  if (!trimmed) return "";
  return trimmed.endsWith(",") ? "" : ",";
}

function lineIndentBefore(source, index) {
  const lineStart = source.lastIndexOf("\n", index) + 1;
  const match = /^[ \t]*/.exec(source.slice(lineStart, index));
  return match?.[0] ?? "";
}

function findRootObjectBodyStart(source) {
  const defaultMatch = /export\s+default\s*\{/.exec(source);
  if (defaultMatch) return defaultMatch.index + defaultMatch[0].length;
  const namedMatch = /=\s*\{/.exec(source);
  if (namedMatch) return namedMatch.index + namedMatch[0].length;
  throw new Error("Root locale object not found");
}

/**
 * 새 flowText 문구처럼 기존 locale 파일에 아직 없는 문자열 leaf를 추가한다.
 * @param {string} source
 * @param {number} objectBodyStart index right after `{`
 * @param {string[]} parts
 * @param {string} newValue
 */
function insertNestedStringPath(source, objectBodyStart, parts, newValue) {
  const close = findClosingBrace(source, objectBodyStart);
  const indent = `${lineIndentBefore(source, close)}  `;
  const valueJs = parts
    .slice(1)
    .reduceRight(
      (body, key, idx) =>
        `{\n${indent}${"  ".repeat(idx + 1)}"${key}": ${body}\n${indent}${"  ".repeat(idx)}}`,
      `"${escapeJsString(newValue)}"`,
    );
  const comma = source.slice(objectBodyStart, close).trim() ? "," : "";
  const insert = `${comma}\n${indent}"${parts[0]}": ${valueJs}`;
  return `${source.slice(0, close)}${insert}${source.slice(close)}`;
}

/**
 * @param {string} source
 * @param {string[]} parts
 * @param {string} newValue
 */
function upsertObjectStringPath(source, parts, newValue) {
  let objectBodyStart = findRootObjectBodyStart(source);
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    const close = findClosingBrace(source, objectBodyStart);
    const scope = source.slice(objectBodyStart, close);
    const re = new RegExp(`${keyInSourcePattern(key)}\\s*:\\s*\\{`);
    const match = re.exec(scope);
    if (!match) {
      return insertNestedStringPath(source, objectBodyStart, parts.slice(i), newValue);
    }
    objectBodyStart += match.index + match[0].length;
  }

  const leafKey = parts[parts.length - 1];
  const close = findClosingBrace(source, objectBodyStart);
  const scope = source.slice(objectBodyStart, close);
  const leafRe = new RegExp(`${keyInSourcePattern(leafKey)}\\s*:\\s*"`);
  const match = leafRe.exec(scope);
  if (match) {
    const quoteIndex = objectBodyStart + match.index + match[0].length - 1;
    const { endIndex } = readJsStringLiteral(source, quoteIndex);
    return `${source.slice(0, quoteIndex)}"${escapeJsString(newValue)}"${source.slice(endIndex + 1)}`;
  }
  return insertNestedStringPath(source, objectBodyStart, [leafKey], newValue);
}

/**
 * @param {string} source
 * @param {number} openBracket index of `[`
 * @returns {number}
 */
function findClosingBracket(source, openBracket) {
  let depth = 0;
  for (let i = openBracket; i < source.length; i++) {
    const ch = source[i];
    if (ch === "[") depth += 1;
    else if (ch === "]") {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  throw new Error("Unclosed bracket");
}

/**
 * groups[gi][j] 같은 이중 문자열 배열 항목 패치
 * @param {string} source
 * @param {string[]} parentParts e.g. couples.groups or services.sections.couples.groups
 * @param {number} outerIndex
 * @param {number} innerIndex
 * @param {string} newValue
 */
function patchNestedStringArrayItem(
  source,
  parentParts,
  outerIndex,
  innerIndex,
  newValue,
) {
  const arrayKey = parentParts[parentParts.length - 1];
  const objectParents = parentParts.slice(0, -1);
  const scopeStart = objectParents.length
    ? resolveScopeStart(source, objectParents)
    : 0;
  const scope = source.slice(scopeStart);
  const arrayRe = new RegExp(`${keyInSourcePattern(arrayKey)}\\s*:\\s*\\[`);
  const match = arrayRe.exec(scope);
  if (!match) {
    throw new Error(`Array key not found: ${arrayKey} at ${parentParts.join(".")}`);
  }

  let cursor = scopeStart + match.index + match[0].length;
  let foundOuter = 0;
  while (cursor < source.length) {
    const ch = source[cursor];
    if (ch === "]") {
      throw new Error(
        `Nested array index ${outerIndex}.${innerIndex} not found at ${parentParts.join(".")}`,
      );
    }
    if (ch === "[") {
      if (foundOuter === outerIndex) {
        let innerCursor = cursor + 1;
        let foundInner = 0;
        while (innerCursor < source.length) {
          const ic = source[innerCursor];
          if (ic === "]") {
            throw new Error(
              `Nested string index ${innerIndex} not found at ${parentParts.join(".")}`,
            );
          }
          if (ic === '"') {
            if (foundInner === innerIndex) {
              const { endIndex } = readJsStringLiteral(source, innerCursor);
              const escaped = escapeJsString(newValue);
              return `${source.slice(0, innerCursor)}"${escaped}"${source.slice(endIndex + 1)}`;
            }
            const { endIndex } = readJsStringLiteral(source, innerCursor);
            innerCursor = endIndex + 1;
            foundInner += 1;
            continue;
          }
          innerCursor += 1;
        }
        throw new Error(`Nested string index ${innerIndex} not found`);
      }
      const close = findClosingBracket(source, cursor);
      cursor = close + 1;
      foundOuter += 1;
      continue;
    }
    cursor += 1;
  }
  throw new Error(`Nested array index ${outerIndex} not found`);
}

/**
 * @param {string} source
 * @param {string} keyPath e.g. pages.whoWeAre.title or pages.whoWeAre.paragraphs.0
 * @param {string} newValue
 */
export function patchLocaleFile(source, keyPath, newValue) {
  const parts = keyPath.split(".");
  if (parts.includes("flowText")) {
    return upsertObjectStringPath(source, parts, newValue);
  }
  const last = parts[parts.length - 1];
  const secondLast = parts[parts.length - 2];

  if (
    secondLast !== undefined &&
    /^\d+$/.test(last) &&
    /^\d+$/.test(secondLast)
  ) {
    return patchNestedStringArrayItem(
      source,
      parts.slice(0, -2),
      Number(secondLast),
      Number(last),
      newValue,
    );
  }

  if (/^\d+$/.test(last)) {
    return patchArrayIndex(source, parts.slice(0, -1), Number(last), newValue);
  }

  const leafKey = last;
  const parentKeys = parts.slice(0, -1);
  const scopeStart = parentKeys.length ? resolveScopeStart(source, parentKeys) : 0;
  const scope = source.slice(scopeStart);
  const leafRe = new RegExp(`${keyInSourcePattern(leafKey)}\\s*:\\s*"`);
  const match = leafRe.exec(scope);
  if (!match) {
    throw new Error(`Leaf key not found: ${leafKey} at ${keyPath}`);
  }

  const quoteIndex = scopeStart + match.index + match[0].length - 1;
  const { endIndex } = readJsStringLiteral(source, quoteIndex);
  const escaped = escapeJsString(newValue);
  return `${source.slice(0, quoteIndex)}"${escaped}"${source.slice(endIndex + 1)}`;
}

/**
 * @param {string} source
 * @param {string[]} parts path to array key, last segment is array property name
 * @param {number} index
 * @param {string} newValue
 */
function patchArrayIndex(source, parts, index, newValue) {
  const arrayKey = parts[parts.length - 1];
  const parentKeys = parts.slice(0, -1);
  // findScopeStart → resolveScopeStart: subsections.0 같은 배열+인덱스 경로 지원
  const scopeStart = parentKeys.length ? resolveScopeStart(source, parentKeys) : 0;
  const scope = source.slice(scopeStart);
  const arrayRe = new RegExp(`${keyInSourcePattern(arrayKey)}\\s*:\\s*\\[`);
  const match = arrayRe.exec(scope);
  if (!match) {
    throw new Error(`Array key not found: ${arrayKey}`);
  }

  let cursor = scopeStart + match.index + match[0].length;
  let found = 0;
  while (cursor < source.length) {
    const ch = source[cursor];
    if (ch === "]") {
      throw new Error(`Array index ${index} not found at ${parts.join(".")}`);
    }
    if (ch === '"') {
      if (found === index) {
        const { endIndex } = readJsStringLiteral(source, cursor);
        const escaped = escapeJsString(newValue);
        return `${source.slice(0, cursor)}"${escaped}"${source.slice(endIndex + 1)}`;
      }
      const { endIndex } = readJsStringLiteral(source, cursor);
      cursor = endIndex + 1;
      found += 1;
      continue;
    }
    cursor += 1;
  }
  throw new Error(`Array index ${index} not found`);
}

/**
 * @param {string} source
 * @param {string} keyPath path to string array (e.g. pages.whoWeAre.paragraphs)
 * @param {string[]} items
 */
export function replaceStringArray(source, keyPath, items) {
  const parts = keyPath.split(".");
  const arrayKey = parts[parts.length - 1];
  const parentKeys = parts.slice(0, -1);
  const scopeStart = parentKeys.length ? resolveScopeStart(source, parentKeys) : 0;
  const bracketIndex = findTopLevelArrayKeyBracketIndex(source, parentKeys, arrayKey);
  if (bracketIndex === null) {
    throw new Error(`Array key not found: ${arrayKey} at ${keyPath}`);
  }
  let depth = 0;
  let endBracket = bracketIndex;
  for (let i = bracketIndex; i < source.length; i++) {
    const ch = source[i];
    if (ch === "[") depth += 1;
    else if (ch === "]") {
      depth -= 1;
      if (depth === 0) {
        endBracket = i;
        break;
      }
    }
  }

  const body =
    items.length === 0
      ? ""
      : `\n${items.map((item) => `    "${escapeJsString(item)}"`).join(",\n")}\n  `;
  const replacement = `[${body}]`;
  return `${source.slice(0, bracketIndex)}${replacement}${source.slice(endBracket + 1)}`;
}

/**
 * @param {string[][] | undefined} groups
 */
function nestedStringGroupsToJs(groups) {
  if (!groups?.length) return "[]";
  const inner = groups
    .map(
      (group) =>
        `[\n        ${group.map((line) => `"${escapeJsString(line)}"`).join(",\n        ")}\n      ]`,
    )
    .join(",\n      ");
  return `[\n      ${inner}\n    ]`;
}

/**
 * string[][] (groups 등) 배열 전체 교체
 * @param {string} source
 * @param {string} keyPath e.g. group.groups or pages.whoWeAre.groups
 * @param {string[][]} groups
 */
export function replaceNestedStringArray(source, keyPath, groups) {
  const parts = keyPath.split(".");
  const arrayKey = parts[parts.length - 1];
  const parentKeys = parts.slice(0, -1);
  const scopeStart = parentKeys.length ? resolveScopeStart(source, parentKeys) : 0;
  const bracketIndex = findTopLevelArrayKeyBracketIndex(source, parentKeys, arrayKey);
  if (bracketIndex === null) {
    throw new Error(`Nested array key not found: ${arrayKey} at ${keyPath}`);
  }
  let depth = 0;
  let endBracket = bracketIndex;
  for (let i = bracketIndex; i < source.length; i++) {
    const ch = source[i];
    if (ch === "[") depth += 1;
    else if (ch === "]") {
      depth -= 1;
      if (depth === 0) {
        endBracket = i;
        break;
      }
    }
  }

  const replacement = nestedStringGroupsToJs(groups);
  return `${source.slice(0, bracketIndex)}${replacement}${source.slice(endBracket + 1)}`;
}

/**
 * @param {{ lead?: string, items: string[] }} list
 */
function listBlockToJs(list) {
  const lines = [];
  if (list.lead?.trim()) {
    lines.push(`lead: "${escapeJsString(list.lead)}"`);
  }
  const items = list.items ?? [];
  const itemsBody =
    items.length === 0
      ? ""
      : `\n          ${items.map((item) => `"${escapeJsString(item)}"`).join(",\n          ")}\n        `;
  lines.push(`items: [${itemsBody}]`);
  return `{\n        ${lines.join(",\n        ")}\n      }`;
}

/**
 * @param {{ lead?: string, items: string[] }[] | undefined} lists
 */
function listBlocksToJs(lists) {
  if (!lists?.length) return "[]";
  return `[\n      ${lists.map((list) => listBlockToJs(list)).join(",\n      ")}\n    ]`;
}

/**
 * lists: [{ lead, items }] 배열 전체 교체·없으면 섹션 객체에 추가
 * @param {string} source
 * @param {string} keyPath e.g. pages.whoWeAre.lists or group.lists
 * @param {{ lead?: string, items: string[] }[]} lists
 */
export function replaceListBlocksArray(source, keyPath, lists) {
  const parts = keyPath.split(".");
  const arrayKey = parts[parts.length - 1];
  const parentKeys = parts.slice(0, -1);
  const scopeStart = parentKeys.length ? resolveScopeStart(source, parentKeys) : 0;
  let bracketIndex = findTopLevelArrayKeyBracketIndex(source, parentKeys, arrayKey);

  if (bracketIndex === null) {
    const close = findClosingBrace(source, scopeStart);
    const indent = lineIndentBefore(source, close);
    const childIndent = `${indent}  `;
    const comma = commaBeforeObjectInsert(source, scopeStart, close);
    const listsJs = listBlocksToJs(lists)
      .split("\n")
      .map((line, i) => (i === 0 ? line : `${childIndent}${line}`))
      .join("\n");
    const insert = `${comma}\n${childIndent}${arrayKey}: ${listsJs}`;
    return `${source.slice(0, close)}${insert}${source.slice(close)}`;
  }
  let depth = 0;
  let endBracket = bracketIndex;
  for (let i = bracketIndex; i < source.length; i++) {
    const ch = source[i];
    if (ch === "[") depth += 1;
    else if (ch === "]") {
      depth -= 1;
      if (depth === 0) {
        endBracket = i;
        break;
      }
    }
  }

  const replacement = listBlocksToJs(lists);
  return `${source.slice(0, bracketIndex)}${replacement}${source.slice(endBracket + 1)}`;
}

/**
 * @param {{ number: string, title: string, description: string }} step
 */
function stepObjectToJs(step) {
  return `{
      number: "${escapeJsString(step.number)}",
      title: "${escapeJsString(step.title)}",
      description: "${escapeJsString(step.description)}"
    }`;
}

/**
 * @param {string} source
 * @param {string} keyPath e.g. pages.gettingStarted.steps
 * @param {{ number: string, title: string, description: string }[]} steps
 */
export function replaceStepsArray(source, keyPath, steps) {
  const parts = keyPath.split(".");
  const arrayKey = parts[parts.length - 1];
  const parentKeys = parts.slice(0, -1);
  const scopeStart = parentKeys.length ? resolveScopeStart(source, parentKeys) : 0;
  const scope = source.slice(scopeStart);
  const arrayRe = new RegExp(`${keyInSourcePattern(arrayKey)}\\s*:\\s*\\[`);
  const match = arrayRe.exec(scope);
  if (!match) {
    throw new Error(`Steps array key not found: ${arrayKey} at ${keyPath}`);
  }

  const bracketIndex = scopeStart + match.index + match[0].length - 1;
  let depth = 0;
  let endBracket = bracketIndex;
  for (let i = bracketIndex; i < source.length; i++) {
    const ch = source[i];
    if (ch === "[") depth += 1;
    else if (ch === "]") {
      depth -= 1;
      if (depth === 0) {
        endBracket = i;
        break;
      }
    }
  }

  const body =
    steps.length === 0
      ? ""
      : `\n${steps.map((step) => `    ${stepObjectToJs(step)}`).join(",\n")}\n  `;
  const replacement = `[${body}]`;
  return `${source.slice(0, bracketIndex)}${replacement}${source.slice(endBracket + 1)}`;
}

/**
 * @param {import("../lib/edit/section-flow.ts").StoredFlowBlock} block
 */
function storedFlowBlockToJs(block) {
  switch (block.type) {
    case "hr":
      return '{ type: "hr" }';
    case "p":
      return `{ type: "p", textKey: "${escapeJsString(block.textKey)}" }`;
    case "heading":
      return `{ type: "heading", textKey: "${escapeJsString(block.textKey)}" }`;
    case "sectionTitle":
      return `{ type: "sectionTitle", textKey: "${escapeJsString(block.textKey)}" }`;
    case "button":
      return `{ type: "button", textKey: "${escapeJsString(block.textKey)}" }`;
    case "list":
      return block.lead
        ? `{ type: "list", listKey: "${escapeJsString(block.listKey)}", ordered: ${Boolean(block.ordered)}, lead: "${escapeJsString(block.lead)}" }`
        : `{ type: "list", listKey: "${escapeJsString(block.listKey)}", ordered: ${Boolean(block.ordered)} }`;
    case "bullets":
      return block.lead
        ? `{ type: "bullets", listKey: "${escapeJsString(block.listKey)}", lead: "${escapeJsString(block.lead)}" }`
        : `{ type: "bullets", listKey: "${escapeJsString(block.listKey)}" }`;
    case "img":
      return `{ type: "img", editKey: "${escapeJsString(block.editKey)}", src: "${escapeJsString(block.src)}" }`;
    default:
      return '{ type: "hr" }';
  }
}

/**
 * 섹션 객체에 flow 배열 저장·교체 (예: couples.flow, pages.whoWeAre)
 * @param {string} source
 * @param {string|string[]} sectionScope e.g. couples or ["pages","whoWeAre"]
 * @param {object[]} blocks StoredFlowBlock[]
 */
export function replaceSectionFlow(source, sectionScope, blocks) {
  const parentKeys = Array.isArray(sectionScope)
    ? sectionScope
    : [sectionScope];
  const cleaned = removeAllTopLevelArrayProperties(source, parentKeys, "flow");
  const scopeStart = resolveScopeStart(cleaned, parentKeys);
  // 파일 내 실제 들여쓰기 대신 depth 기반으로 계산 — removeAllTopLevelArrayProperties 후 }가
  // 같은 줄에 붙어 있을 때 lineIndentBefore가 잘못된 값을 반환하는 버그를 방지한다.
  const indent = "  ".repeat(parentKeys.length);
  const childIndent = `${indent}  `;
  // body는 상대 들여쓰기(2칸/0칸)로 작성 — flowJs 맵에서 childIndent를 절대값으로 붙임
  const body =
    blocks.length === 0
      ? ""
      : `\n${blocks.map((b) => `  ${storedFlowBlockToJs(b)}`).join(",\n")}\n`;
  const close = findClosingBrace(cleaned, scopeStart);
  const comma = commaBeforeObjectInsert(cleaned, scopeStart, close);
  // flowJs: 첫 줄 제외 각 줄에 childIndent 추가 → 절대 들여쓰기 완성
  const flowJs = `"flow": [${body}]`
    .split("\n")
    .map((line, i) => (i === 0 ? line : `${childIndent}${line}`))
    .join("\n");
  // trimEnd()로 } 앞 trailing whitespace 제거 → comma가 새 줄에 고립되는 현상 방지
  const before = cleaned.slice(0, close).trimEnd();
  return `${before}${comma}\n${childIndent}${flowJs}\n${indent}${cleaned.slice(close)}`;
}

/**
 * @param {string[][] | undefined} groups
 */
function groupsToJs(groups) {
  return nestedStringGroupsToJs(groups);
}

/**
 * @param {{ title: string, tagline?: string, groups?: string[][], lists?: unknown[], subsections?: unknown[], closing?: string[] }} section
 */
export function sectionContentToJs(section) {
  const lines = [`title: "${escapeJsString(section.title)}"`];
  if (section.tagline !== undefined) {
    lines.push(`tagline: "${escapeJsString(section.tagline)}"`);
  }
  lines.push(`groups: ${groupsToJs(section.groups)}`);
  if (section.subsections !== undefined) {
    lines.push("subsections: []");
  }
  lines.push("lists: []");
  lines.push(
    `closing: ${section.closing?.length ? `[\n      "${escapeJsString(section.closing[0] ?? "")}"\n    ]` : "[]"}`,
  );
  return `{\n    ${lines.join(",\n    ")}\n  }`;
}

/**
 * locales/content/services.*.js 루트 객체에 섹션 키 추가
 * @param {string} source
 * @param {string} sectionKey
 * @param {string} sectionJs
 */
export function insertContentSectionKey(source, sectionKey, sectionJs) {
  const bodyStart = findRootObjectBodyStart(source);
  const close = findClosingBrace(source, bodyStart);
  const indent = lineIndentBefore(source, close);
  const keyPart = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(sectionKey)
    ? sectionKey
    : `"${escapeJsString(sectionKey)}"`;
  const trimmed = source.slice(bodyStart, close).trim();
  // 이미 trailing comma가 있으면 추가하지 않음 — double comma 방지
  const needsComma = trimmed.length > 0 && !trimmed.endsWith(",");
  const insert = `${needsComma ? "," : ""}\n${indent}  ${keyPart}: ${sectionJs}`;
  return `${source.slice(0, close)}${insert}\n${source.slice(close)}`;
}

/**
 * locales/content/* sections export 에서 최상위 섹션 키 제거
 * @param {string} source
 * @param {string} sectionKey
 */
export function removeContentSectionKey(source, sectionKey) {
  const bodyStart = findRootObjectBodyStart(source);
  const scope = source.slice(bodyStart);
  const keyRe = new RegExp(`${keyInSourcePattern(sectionKey)}\\s*:\\s*\\{`);
  const match = keyRe.exec(scope);
  if (!match) {
    throw new Error(`Section key not found in content: ${sectionKey}`);
  }
  const keyStart = bodyStart + match.index;
  const sectionBodyStart = keyStart + match[0].length;
  const closeBrace = findClosingBrace(source, sectionBodyStart);
  let end = closeBrace + 1;
  while (end < source.length && /[ \t\r\n]/.test(source[end])) end++;
  if (source[end] === ",") end++;
  let start = keyStart;
  while (start > bodyStart) {
    const prev = source[start - 1];
    if (prev === ",") {
      start -= 1;
      break;
    }
    if (prev === "\n" || prev === "\r" || prev === " " || prev === "\t") {
      start -= 1;
      continue;
    }
    break;
  }
  return `${source.slice(0, start)}${source.slice(end)}`;
}
