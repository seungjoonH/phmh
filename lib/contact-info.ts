// 연락처 표시 헬퍼 — 이메일은 env SSOT, 주소·전화는 locales siteContact.*
import type { Messages } from "@/lib/i18n/messages";
import {
  siteContactKoreaAddress,
  siteContactKoreaEmail,
  siteContactKoreaPhone,
  siteContactPhilippinesAddressFull,
  siteContactPhilippinesAddressShort,
  siteContactPhilippinesEmail,
  siteContactPhilippinesPhone,
  siteContactPhilippinesPhoneViber,
} from "@/lib/site-contact";

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
