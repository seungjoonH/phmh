// 목록 textarea ↔ 항목 배열 변환 + 한국어 에러 메시지

export type ParseListResult =
  | { ok: true; ordered: boolean; items: string[] }
  | { ok: false; error: string };

const UNORDERED_RE = /^([-*•–])\s+(.*)$/;
const ORDERED_RE = /^(\d+)\.\s+(.*)$/;

/** textarea 입력 → 항목 배열 + ordered 추론 */
export function parseListText(raw: string): ParseListResult {
  const lines = raw.split(/\r?\n/).map((l) => l.replace(/\s+$/u, ""));
  const filled = lines.filter((l) => l.trim() !== "");
  if (filled.length === 0) {
    return { ok: true, ordered: false, items: [] };
  }

  let mode: "ul" | "ol" | null = null;
  const items: string[] = [];
  for (let i = 0; i < filled.length; i++) {
    const line = filled[i];
    const ul = UNORDERED_RE.exec(line);
    const ol = ORDERED_RE.exec(line);
    if (ul) {
      if (mode === "ol") {
        return {
          ok: false,
          error: `${i + 1}번째 줄: ‘-’과 ‘1.’을 섞어 쓸 수 없어요. 둘 중 하나만 사용해 주세요.`,
        };
      }
      mode = "ul";
      items.push(ul[2].trim());
      continue;
    }
    if (ol) {
      if (mode === "ul") {
        return {
          ok: false,
          error: `${i + 1}번째 줄: ‘-’과 ‘1.’을 섞어 쓸 수 없어요. 둘 중 하나만 사용해 주세요.`,
        };
      }
      mode = "ol";
      items.push(ol[2].trim());
      continue;
    }
    return {
      ok: false,
      error: `${i + 1}번째 줄: 각 줄은 ‘- 항목’ 또는 ‘1. 항목’ 형식이어야 해요.`,
    };
  }

  return { ok: true, ordered: mode === "ol", items };
}

/** 항목 배열 → textarea 텍스트. 모든 항목이 비어있으면 빈 문자열을 반환한다. */
export function formatListText(items: string[], ordered: boolean): string {
  if (items.length === 0) return "";
  const cleaned = items.map((raw) =>
    raw.replace(/^([•\-–*]|\d+\.)\s*/u, "").trim(),
  );
  if (cleaned.every((s) => s === "")) return "";
  return cleaned
    .map((clean, i) => (ordered ? `${i + 1}. ${clean}` : `- ${clean}`))
    .join("\n");
}
