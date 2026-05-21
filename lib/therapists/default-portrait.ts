// 상담사 기본 프로필 이미지 경로 — 라이트/다크 테마
export const DEFAULT_PORTRAIT_LIGHT = "/therapists/_default-portrait-light.png";
export const DEFAULT_PORTRAIT_DARK = "/therapists/_default-portrait-dark.png";

const PORTRAIT_KEY_RE = /^therapists\.[^.]+\.portrait$/;

export function isTherapistPortraitKey(key: string): boolean {
  return PORTRAIT_KEY_RE.test(key);
}

export function therapistSlugFromPortraitKey(key: string): string | null {
  const m = /^therapists\.([^.]+)\.portrait$/.exec(key);
  return m?.[1] ?? null;
}
