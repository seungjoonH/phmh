// locale 메시지 로더
import { getCachedMessages, ensureLocaleLoaded, type Messages } from "@/lib/i18n/load-locale";

export type { Messages };

export function getMessages(locale: string): Messages {
  const cached = getCachedMessages(locale);
  if (cached) return cached;
  const fallback = getCachedMessages("en");
  if (fallback) return fallback;
  throw new Error(`Locale not loaded: ${locale}`);
}

export { ensureLocaleLoaded };

export function tPath(messages: Messages, path: string): string {
  const parts = path.split(".");
  let current: unknown = messages;
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== "object") {
      return "";
    }
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === "string" ? current : "";
}
