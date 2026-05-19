// 테마 localStorage 키·타입
export const THEME_STORAGE_KEY = "phmh-theme";

export type ThemeMode = "system" | "light" | "dark";

export function resolveTheme(mode: ThemeMode): "light" | "dark" {
  if (mode === "light") return "light";
  if (mode === "dark") return "dark";
  if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}
