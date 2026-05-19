"use client";

// locale 상태 및 번역 훅 Provider
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ensureLocaleLoaded, getCachedMessages } from "@/lib/i18n/load-locale";
import { tPath, type Messages } from "@/lib/i18n/messages";
import {
  defaultLocale,
  getVisibleLocaleIds,
  isLocaleId,
  type LocaleId,
} from "@/lib/site-locales";

const LOCALE_STORAGE_KEY = "phmh-locale";

type LocaleContextValue = {
  locale: LocaleId;
  setLocale: (locale: LocaleId) => void;
  messages: Messages;
  t: (key: string) => string;
  reloadLocales: () => Promise<void>;
};

export const LocaleContext = createContext<LocaleContextValue | null>(null);

function readStoredLocale(): LocaleId {
  if (typeof window === "undefined") return defaultLocale;
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
  if (stored && isLocaleId(stored)) return stored;
  return defaultLocale;
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<LocaleId>(defaultLocale);
  const [messages, setMessages] = useState<Messages>(
    () => getCachedMessages(defaultLocale) ?? getCachedMessages("en")!,
  );
  const [mounted, setMounted] = useState(false);
  const [localeEpoch, setLocaleEpoch] = useState(0);

  const reloadLocales = useCallback(async () => {
    setLocaleEpoch((n) => n + 1);
  }, []);

  useEffect(() => {
    setLocaleState(readStoredLocale());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.lang = locale;
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  }, [locale, mounted]);

  useEffect(() => {
    if (!mounted) return;
    let cancelled = false;
    ensureLocaleLoaded(locale).then((loaded) => {
      if (!cancelled) setMessages(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, [locale, mounted, localeEpoch]);

  useEffect(() => {
    if (!mounted) return;
    const visible = getVisibleLocaleIds();
    for (const id of visible) {
      if (id !== locale) void ensureLocaleLoaded(id);
    }
  }, [locale, mounted, localeEpoch]);

  const setLocale = useCallback((next: LocaleId) => {
    if (isLocaleId(next)) {
      setLocaleState(next);
    }
  }, []);

  const t = useCallback((key: string) => tPath(messages, key), [messages]);

  const value = useMemo(
    () => ({ locale, setLocale, messages, t, reloadLocales }),
    [locale, setLocale, messages, t, reloadLocales],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}

export function useTranslations() {
  return useLocale().t;
}
