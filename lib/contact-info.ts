// 연락처 표시 헬퍼 — UI는 locales siteContact.*, 메일 발송 SSOT는 .env (lib/contact-mail.ts)
import type { Messages } from "@/lib/i18n/messages";
import {
  siteContactEmail,
  siteContactKoreaAddress,
  siteContactKoreaEmail,
  siteContactKoreaPhone,
  siteContactPhilippinesAddressFull,
  siteContactPhilippinesAddressShort,
  siteContactPhilippinesEmail,
  siteContactPhilippinesPhone,
  siteContactPhilippinesPhoneViber,
} from "@/lib/site-contact";

export function getContactEmailDisplay(messages: Messages): string {
  return siteContactEmail(messages);
}

export function getKoreaAddress(messages: Messages): string {
  return siteContactKoreaAddress(messages);
}

export function getKoreaPhone(messages: Messages): string {
  return siteContactKoreaPhone(messages);
}

export function getKoreaEmail(messages: Messages): string {
  return siteContactKoreaEmail(messages);
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

export function getPhilippinesEmail(messages: Messages): string {
  return siteContactPhilippinesEmail(messages);
}
