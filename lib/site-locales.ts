// 사이트에 노출되는 locale — manifest SSOT
import staticManifest from "@/locales/manifest.json";
import {
  availableLocaleById,
  AVAILABLE_LOCALES,
  type AvailableLocale,
} from "@/lib/available-locales";

export type LocaleManifest = {
  order: string[];
  hidden: string[];
};

export type LocaleId = string;

export type LocaleOption = AvailableLocale;

let runtimeManifest: LocaleManifest | null = null;

function getManifestData(): LocaleManifest {
  const source = runtimeManifest ?? staticManifest;
  return {
    order: [...source.order],
    hidden: [...source.hidden],
  };
}

export function setRuntimeLocaleManifest(manifest: LocaleManifest) {
  runtimeManifest = {
    order: [...manifest.order],
    hidden: [...manifest.hidden],
  };
}

export function clearRuntimeLocaleManifest() {
  runtimeManifest = null;
}

export function getLocaleManifest(): LocaleManifest {
  return getManifestData();
}

export function getActiveLocaleIds(): string[] {
  return getManifestData().order;
}

export function getVisibleLocaleIds(): string[] {
  const hidden = new Set(getManifestData().hidden);
  return getManifestData().order.filter((id) => !hidden.has(id));
}

export function resolveLocaleOption(id: string): LocaleOption | undefined {
  return availableLocaleById.get(id);
}

/** 설정·헤더에 표시할 locale (숨김 제외) */
export function getVisibleLocaleOptions(): LocaleOption[] {
  return getVisibleLocaleIds()
    .map((id) => resolveLocaleOption(id))
    .filter((opt): opt is LocaleOption => Boolean(opt));
}

/** 편집 모드 — 순서 전체 (숨김 포함) */
export function getOrderedLocaleOptions(): LocaleOption[] {
  return getManifestData()
    .order.map((id) => resolveLocaleOption(id))
    .filter((opt): opt is LocaleOption => Boolean(opt));
}

export function getAddableLocaleOptions(): LocaleOption[] {
  const active = new Set(getManifestData().order);
  return AVAILABLE_LOCALES.filter((locale) => !active.has(locale.id));
}

export const defaultLocale: LocaleId =
  getVisibleLocaleIds()[0] ?? getManifestData().order[0] ?? "en";

export function isLocaleId(value: string): value is LocaleId {
  return getManifestData().order.includes(value);
}

/** @deprecated use getVisibleLocaleOptions */
export const localeOptions = getVisibleLocaleOptions();
