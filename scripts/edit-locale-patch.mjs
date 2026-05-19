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
      if (found === index) return cursor;
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
  const scopeStart = parentKeys.length ? findScopeStart(source, parentKeys) : 0;
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
  const scopeStart = parentKeys.length ? findScopeStart(source, parentKeys) : 0;
  const scope = source.slice(scopeStart);
  const arrayRe = new RegExp(`${keyInSourcePattern(arrayKey)}\\s*:\\s*\\[`);
  const match = arrayRe.exec(scope);
  if (!match) {
    throw new Error(`Array key not found: ${arrayKey} at ${keyPath}`);
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
    items.length === 0
      ? ""
      : `\n${items.map((item) => `    "${escapeJsString(item)}"`).join(",\n")}\n  `;
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
    case "button":
      return `{ type: "button", textKey: "${escapeJsString(block.textKey)}" }`;
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
 * 섹션 객체에 flow 배열 저장·교체 (예: couples.flow)
 * @param {string} source
 * @param {string} sectionId e.g. couples
 * @param {object[]} blocks StoredFlowBlock[]
 */
export function replaceSectionFlow(source, sectionId, blocks) {
  const scopeStart = resolveScopeStart(source, [sectionId]);
  const scope = source.slice(scopeStart);
  const flowRe = /flow\s*:\s*\[/;
  const body =
    blocks.length === 0
      ? ""
      : `\n${blocks.map((b) => `      ${storedFlowBlockToJs(b)}`).join(",\n")}\n    `;
  const replacement = `[${body}]`;

  const match = flowRe.exec(scope);
  if (match) {
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
    return `${source.slice(0, bracketIndex)}${replacement}${source.slice(endBracket + 1)}`;
  }

  const titleRe = /title\s*:\s*(?:"[^"\\]*(?:\\.[^"\\]*)*"|'[^'\\]*(?:\\.[^'\\]*)*')\s*,?\s*\n/;
  const titleMatch = titleRe.exec(scope);
  const insertAt = titleMatch
    ? scopeStart + titleMatch.index + titleMatch[0].length
    : scopeStart;
  const insert = `    flow: [${body}],\n`;
  return `${source.slice(0, insertAt)}${insert}${source.slice(insertAt)}`;
}
