// 목록 textarea Tab 들여쓰기 — 선택된 모든 줄 앞에 2칸 추가/제거
const INDENT = "  ";

function lineRange(text: string, start: number, end: number) {
  const selStart = Math.min(start, end);
  const selEnd = Math.max(start, end);
  const lineStart = text.lastIndexOf("\n", selStart - 1) + 1;
  let lineEnd = text.indexOf("\n", selEnd);
  if (lineEnd === -1) lineEnd = text.length;
  return { lineStart, lineEnd, selStart, selEnd };
}

function adjustPosAfterOutdent(
  pos: number,
  lineStart: number,
  lineEnd: number,
  lines: string[],
  removedPerLine: number[],
): number {
  if (pos <= lineStart) return pos;
  const totalRemoved = removedPerLine.reduce((sum, n) => sum + n, 0);
  if (pos >= lineEnd) return pos - totalRemoved;

  let offset = 0;
  let cursor = lineStart;
  for (let i = 0; i < lines.length; i++) {
    const lineLen = lines[i].length;
    const lineEndPos = cursor + lineLen;
    const removed = removedPerLine[i];
    if (pos <= cursor) break;
    if (pos > lineEndPos) {
      offset += removed;
      cursor = lineEndPos + 1;
      continue;
    }
    offset += Math.min(removed, pos - cursor);
    break;
  }
  return pos - offset;
}

export function indentTextareaLines(
  text: string,
  selectionStart: number,
  selectionEnd: number,
): { text: string; selectionStart: number; selectionEnd: number } {
  const { lineStart, lineEnd, selStart, selEnd } = lineRange(
    text,
    selectionStart,
    selectionEnd,
  );
  const block = text.slice(lineStart, lineEnd);
  const lines = block.split("\n");
  const indented = lines.map((line) => `${INDENT}${line}`).join("\n");
  const nextText = text.slice(0, lineStart) + indented + text.slice(lineEnd);
  const lineCount = lines.length;
  return {
    text: nextText,
    selectionStart: selStart + INDENT.length,
    selectionEnd: selEnd + INDENT.length * lineCount,
  };
}

export function outdentTextareaLines(
  text: string,
  selectionStart: number,
  selectionEnd: number,
): { text: string; selectionStart: number; selectionEnd: number } {
  const { lineStart, lineEnd, selStart, selEnd } = lineRange(
    text,
    selectionStart,
    selectionEnd,
  );
  const block = text.slice(lineStart, lineEnd);
  const lines = block.split("\n");
  const removedPerLine = lines.map((line) => {
    if (line.startsWith(INDENT)) return INDENT.length;
    if (line.startsWith(" ")) return 1;
    return 0;
  });
  const outdented = lines
    .map((line, i) => line.slice(removedPerLine[i]))
    .join("\n");
  const nextText = text.slice(0, lineStart) + outdented + text.slice(lineEnd);
  return {
    text: nextText,
    selectionStart: adjustPosAfterOutdent(
      selStart,
      lineStart,
      lineEnd,
      lines,
      removedPerLine,
    ),
    selectionEnd: adjustPosAfterOutdent(
      selEnd,
      lineStart,
      lineEnd,
      lines,
      removedPerLine,
    ),
  };
}
