// locale 메시지·contact 폼 동적 로드
import en from "@/locales/en";
import jp from "@/locales/jp";
import ko from "@/locales/ko";
import { contactFormLocaleEn } from "@/lib/contact-form-locale/en.js";
import { contactFormLocaleJp } from "@/lib/contact-form-locale/jp.js";
import { contactFormLocaleKo } from "@/lib/contact-form-locale/ko.js";
import { fetchLocaleCatalog } from "@/lib/edit/client";
import { isEditMode } from "@/lib/edit/env";
import { registerContactFormLocale } from "@/lib/contact-form-schema";
import type { ContactFormLocaleBlock } from "@/lib/contact-form-schema";

export type Messages = typeof en;

const staticCatalogs: Record<string, Messages> = {
  en,
  ko: ko as unknown as Messages,
  jp: jp as unknown as Messages,
};

registerContactFormLocale("en", contactFormLocaleEn);
registerContactFormLocale("ko", contactFormLocaleKo);
registerContactFormLocale("jp", contactFormLocaleJp);

const messageCache: Record<string, Messages> = { ...staticCatalogs };
const loading = new Map<string, Promise<Messages>>();

function exportSuffix(id: string) {
  return id.charAt(0).toUpperCase() + id.slice(1);
}

async function importContactFormLocale(id: string): Promise<ContactFormLocaleBlock> {
  const mod = await import(`@/lib/contact-form-locale/${id}.js`);
  const key = `contactFormLocale${exportSuffix(id)}` as keyof typeof mod;
  const block = mod[key] as ContactFormLocaleBlock;
  registerContactFormLocale(id, block);
  return block;
}

async function loadLocaleFromEditServer(localeId: string): Promise<Messages> {
  const { messages, contact } = await fetchLocaleCatalog(localeId);
  registerContactFormLocale(localeId, contact as ContactFormLocaleBlock);
  const typed = messages as Messages;
  messageCache[localeId] = typed;
  return typed;
}

export async function ensureLocaleLoaded(localeId: string): Promise<Messages> {
  if (messageCache[localeId]) return messageCache[localeId];

  const pending = loading.get(localeId);
  if (pending) return pending;

  const promise = (async () => {
    try {
      const mod = await import(`@/locales/${localeId}.js`);
      const messages = mod.default as Messages;
      messageCache[localeId] = messages;
      await importContactFormLocale(localeId);
      return messages;
    } catch (err) {
      if (!isEditMode()) throw err;
      return loadLocaleFromEditServer(localeId);
    }
  })();

  loading.set(localeId, promise);
  try {
    return await promise;
  } finally {
    loading.delete(localeId);
  }
}

export async function reloadLocale(localeId: string): Promise<Messages> {
  if (isEditMode()) {
    return loadLocaleFromEditServer(localeId);
  }
  return ensureLocaleLoaded(localeId);
}

export function getCachedMessages(localeId: string): Messages | undefined {
  return messageCache[localeId];
}

export function primeLocaleCache(localeId: string, messages: Messages) {
  messageCache[localeId] = messages;
}
