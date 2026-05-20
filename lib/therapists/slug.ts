// 상담사 표시 이름에서 URL slug 자동 생성
/**
 * @param {string} displayName
 * @param {string[]} existingSlugs
 */
export function slugFromDisplayName(displayName: string, existingSlugs: string[] = []): string {
  const kept = displayName.replace(/[^a-zA-Z ]+/g, " ").replace(/\s+/g, " ").trim();
  let base = kept
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .join("-")
    .replace(/^-+|-+$/g, "");

  if (!base) {
    base = `therapist-${Date.now().toString(36)}`;
  }

  const used = new Set(existingSlugs);
  if (!used.has(base)) return base;

  let n = 2;
  while (used.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}
