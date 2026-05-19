// 추가 가능한 전체 locale 풀 (국기 에셋 경로)
export type AvailableLocale = {
  id: string;
  flagSrc: string;
  label: string;
};

export const AVAILABLE_LOCALES: readonly AvailableLocale[] = [
  { id: "en", flagSrc: "/flags/en.svg", label: "English" },
  { id: "ko", flagSrc: "/flags/ko.svg", label: "한국어" },
  { id: "jp", flagSrc: "/flags/jp.svg", label: "日本語" },
  { id: "cn", flagSrc: "/flags/cn.svg", label: "中文" },
  { id: "fr", flagSrc: "/flags/fr.svg", label: "Français" },
  { id: "de", flagSrc: "/flags/de.svg", label: "Deutsch" },
  { id: "es", flagSrc: "/flags/es.svg", label: "Español" },
] as const;

export const availableLocaleById = new Map(
  AVAILABLE_LOCALES.map((locale) => [locale.id, locale]),
);
