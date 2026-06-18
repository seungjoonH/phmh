// 중첩 목록 트리 — textarea 파싱·포맷·자동 정렬·구조 시그니처

export type ListMarker = "dash" | "dot" | "decimal-dot" | "decimal-paren";

export type ListKind = "ordered" | "unordered";

export type ListTreeNode = {
  text: string;
  marker: ListMarker;
  children?: ListTreeNode[];
};

export type ListTree = ListTreeNode[];

export const LIST_MAX_DEPTH = 4;
export const LIST_INDENT_SPACES = 2;

export type ParseListTreeResult =
  | { ok: true; tree: ListTree; rootOrdered: boolean }
  | { ok: false; error: string };

const MARKER_PATTERNS: { marker: ListMarker; re: RegExp }[] = [
  { marker: "decimal-dot", re: /^(\d+)\.\s+(.*)$/ },
  { marker: "decimal-paren", re: /^(\d+)\)\s+(.*)$/ },
  { marker: "dash", re: /^-\s+(.*)$/ },
  { marker: "dot", re: /^\*\s+(.*)$/ },
];

export function markerKind(marker: ListMarker): ListKind {
  return marker === "dash" || marker === "dot" ? "unordered" : "ordered";
}

export function markerPrefix(marker: ListMarker, index: number): string {
  switch (marker) {
    case "dash":
      return "- ";
    case "dot":
      return "* ";
    case "decimal-dot":
      return `${index}. `;
    case "decimal-paren":
      return `${index}) `;
  }
}

function parseLineMarker(content: string): { marker: ListMarker; text: string } | null {
  for (const { marker, re } of MARKER_PATTERNS) {
    const m = re.exec(content);
    if (m) {
      const text = m[2] ?? m[1] ?? "";
      return { marker, text };
    }
  }
  return null;
}

function countLeadingSpaces(line: string): number {
  const m = /^ */.exec(line);
  return m ? m[0].length : 0;
}

type StackFrame = { depth: number; node: ListTreeNode };

function textTargetAtDepth(
  root: ListTree,
  stack: StackFrame[],
  depth: number,
): ListTreeNode | null {
  while (stack.length > 0 && stack[stack.length - 1].depth > depth) {
    stack.pop();
  }
  if (stack.length > 0 && stack[stack.length - 1].depth === depth) {
    return stack[stack.length - 1].node;
  }
  if (depth === 0 && root.length > 0) return root[root.length - 1];
  return null;
}

function appendLineBreak(target: ListTreeNode) {
  target.text = `${target.text}\n`;
}

/** legacy string[] 또는 트리 노드 배열을 ListTree 로 정규화 */
export function normalizeListTree(
  value: unknown,
  defaultMarker: ListMarker = "dash",
): ListTree {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => normalizeListTreeNode(entry, defaultMarker));
}

function normalizeListTreeNode(
  entry: unknown,
  defaultMarker: ListMarker,
): ListTreeNode {
  if (typeof entry === "string") {
    return { text: stripLegacyMarker(entry), marker: defaultMarker };
  }
  if (entry && typeof entry === "object") {
    const raw = entry as Record<string, unknown>;
    const text = typeof raw.text === "string" ? raw.text : "";
    const marker = isListMarker(raw.marker) ? raw.marker : defaultMarker;
    const children = Array.isArray(raw.children)
      ? raw.children.map((c) => normalizeListTreeNode(c, defaultMarker))
      : undefined;
    return children?.length ? { text, marker, children } : { text, marker };
  }
  return { text: "", marker: defaultMarker };
}

function isListMarker(value: unknown): value is ListMarker {
  return (
    value === "dash" ||
    value === "dot" ||
    value === "decimal-dot" ||
    value === "decimal-paren"
  );
}

function stripLegacyMarker(text: string): string {
  return text.replace(/^([-*•–]|\d+[.)])\s*/u, "").trim();
}

/** textarea → 트리. 빈 줄은 직전 항목에 \\n. 마커 없는 줄은 이어쓰기. */
export function parseListTreeText(raw: string): ParseListTreeResult {
  const lines = raw.split(/\r?\n/).map((l) => l.replace(/\s+$/u, ""));
  const root: ListTree = [];
  const stack: StackFrame[] = [];
  let lineNo = 0;

  for (const line of lines) {
    if (line.trim() === "") {
      const target =
        stack.length > 0
          ? stack[stack.length - 1].node
          : root.length > 0
            ? root[root.length - 1]
            : null;
      if (target) appendLineBreak(target);
      continue;
    }
    lineNo += 1;

    const spaces = countLeadingSpaces(line);
    if (spaces % LIST_INDENT_SPACES !== 0) {
      return {
        ok: false,
        error: `${lineNo}번째 줄: 들여쓰기는 ${LIST_INDENT_SPACES}칸 단위여야 해요.`,
      };
    }
    const depth = spaces / LIST_INDENT_SPACES;
    if (depth >= LIST_MAX_DEPTH) {
      return {
        ok: false,
        error: `${lineNo}번째 줄: 최대 ${LIST_MAX_DEPTH}단계까지만 지원해요.`,
      };
    }

    const content = line.slice(spaces);
    const parsed = parseLineMarker(content);
    if (!parsed) {
      const target = textTargetAtDepth(root, stack, depth);
      if (!target) {
        return {
          ok: false,
          error: `${lineNo}번째 줄: ‘1. ’, ‘1) ’, ‘- ’, ‘* ’ 중 하나로 시작해야 해요.`,
        };
      }
      target.text = target.text ? `${target.text}\n${content}` : content;
      continue;
    }

    const node: ListTreeNode = { text: parsed.text, marker: parsed.marker };

    if (depth === 0) {
      const siblingKind = root.length > 0 ? markerKind(root[0].marker) : null;
      const kind = markerKind(parsed.marker);
      if (siblingKind && siblingKind !== kind) {
        return {
          ok: false,
          error: `${lineNo}번째 줄: 같은 깊이에서는 순서 목록과 글머리를 섞을 수 없어요.`,
        };
      }
      root.push(node);
      stack.length = 0;
      stack.push({ depth: 0, node });
      continue;
    }

    while (stack.length > 0 && stack[stack.length - 1].depth >= depth) {
      stack.pop();
    }
    if (stack.length === 0) {
      return {
        ok: false,
        error: `${lineNo}번째 줄: 상위 항목 없이 들여쓸 수 없어요.`,
      };
    }
    const parent = stack[stack.length - 1].node;
    const parentDepth = stack[stack.length - 1].depth;
    if (depth > parentDepth + 1) {
      return {
        ok: false,
        error: `${lineNo}번째 줄: 한 단계씩만 들여쓸 수 있어요.`,
      };
    }

    if (!parent.children) parent.children = [];
    const siblings = parent.children;
    const siblingKind = siblings.length > 0 ? markerKind(siblings[0].marker) : null;
    const kind = markerKind(parsed.marker);
    if (siblingKind && siblingKind !== kind) {
      return {
        ok: false,
        error: `${lineNo}번째 줄: 같은 깊이에서는 순서 목록과 글머리를 섞을 수 없어요.`,
      };
    }
    siblings.push(node);
    stack.push({ depth, node });
  }

  const rootOrdered =
    root.length > 0 ? markerKind(root[0].marker) === "ordered" : false;
  return { ok: true, tree: root, rootOrdered };
}

function formatNodes(nodes: ListTree, depth: number): string[] {
  const lines: string[] = [];
  const indent = " ".repeat(depth * LIST_INDENT_SPACES);
  const canonicalMarker = nodes[0].marker;
  const kind = markerKind(canonicalMarker);
  let order = 1;
  for (const node of nodes) {
    const index = kind === "ordered" ? order++ : 1;
    const textLines = node.text.split("\n");
    lines.push(
      `${indent}${markerPrefix(canonicalMarker, index)}${textLines[0] ?? ""}`,
    );
    for (let i = 1; i < textLines.length; i++) {
      const extra = textLines[i];
      lines.push(extra === "" ? "" : `${indent}${extra}`);
    }
    if (node.children?.length) {
      lines.push(...formatNodes(node.children, depth + 1));
    }
  }
  return lines;
}

/** 같은 깊이 형제 — 첫 항목 마커로 통일 (자식 목록은 각자 첫 항목 기준) */
export function normalizeListTreeMarkers(tree: ListTree): ListTree {
  if (tree.length === 0) return [];
  const canonical = tree[0].marker;
  return tree.map((node) => {
    const children = node.children?.length
      ? normalizeListTreeMarkers(node.children)
      : undefined;
    const next = { ...node, marker: canonical };
    return children?.length ? { ...next, children } : next;
  });
}

/** 트리 → textarea. 각 깊이의 첫 항목 마커·번호로 형제를 통일한다. */
export function formatListTreeText(tree: ListTree): string {
  const normalized = normalizeListTreeMarkers(tree);
  if (normalized.length === 0) return "";
  if (normalized.every((n) => n.text.trim() === "")) return "";
  return formatNodes(normalized, 0).join("\n");
}

/** 파싱 가능한 경우에만 정규 들여쓰기·번호로 재포맷 */
export function autoFormatListText(raw: string): ParseListTreeResult {
  const parsed = parseListTreeText(raw);
  if (!parsed.ok) return parsed;
  const tree = normalizeListTreeMarkers(parsed.tree);
  return {
    ok: true,
    tree,
    rootOrdered: tree.length > 0 ? markerKind(tree[0].marker) === "ordered" : false,
  };
}

/** locale 간 구조 비교 — 마커 종류·트리 형태만 (텍스트 제외) */
export function listTreeStructureSignature(tree: ListTree): string {
  return JSON.stringify(tree.map(signatureNode));
}

function signatureNode(node: ListTreeNode): unknown {
  const out: { m: ListMarker; c?: unknown[] } = { m: node.marker };
  if (node.children?.length) {
    out.c = node.children.map(signatureNode);
  }
  return out;
}

export function listTreesStructurallyEqual(a: ListTree, b: ListTree): boolean {
  return listTreeStructureSignature(a) === listTreeStructureSignature(b);
}

/** flat string[] 호환 — 기존 데이터 로드용 */
export function listTreeFromFlatStrings(
  items: string[],
  ordered: boolean,
): ListTree {
  const marker: ListMarker = ordered ? "decimal-dot" : "dash";
  return items.map((text) => ({
    text: stripLegacyMarker(text),
    marker,
  }));
}

export function flattenListTreeText(tree: ListTree): string[] {
  const out: string[] = [];
  const walk = (nodes: ListTree) => {
    for (const node of nodes) {
      out.push(node.text);
      if (node.children?.length) walk(node.children);
    }
  };
  walk(tree);
  return out;
}
