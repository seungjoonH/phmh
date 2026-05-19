// 연락처 표시 헬퍼 — UI는 locales siteContact.*, 메일 발송은 siteConfig.contact.email
import { siteConfig } from "@/lib/config";
import type { Messages } from "@/lib/i18n/messages";
import {
  siteContactEmail,
  siteContactKoreaAddress,
  siteContactPhilippinesAddressFull,
  siteContactPhilippinesAddressShort,
  siteContactPhilippinesPhone,
  siteContactPhilippinesPhoneViber,
} from "@/lib/site-contact";

/** @deprecated use siteContactEmail(messages) */
export function getContactEmail(): string {
  return siteConfig.contact.email;
}

export function getContactEmailDisplay(messages: Messages): string {
  return siteContactEmail(messages);
}

export function getKoreaAddress(messages: Messages): string {
  return siteContactKoreaAddress(messages);
}

export function getPhilippinesAddressShort(messages: Messages): string {
  return siteContactPhilippinesAddressShort(messages);
}

export function getPhilippinesAddressFull(messages: Messages): string {
  return siteContactPhilippinesAddressFull(messages);
}

export function getPhilippinesPhone(messages: Messages): string {
  return siteContactPhilippinesPhone(messages);
}

export function getPhilippinesPhoneViber(messages: Messages): string {
  return siteContactPhilippinesPhoneViber(messages);
}
