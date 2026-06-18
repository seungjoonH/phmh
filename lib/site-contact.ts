// 연락처 표시 — 주소·전화는 locales siteContact.*, 이메일은 .env (KOREA_*, PHILIPPINES_*)
import { tPath, type Messages } from "@/lib/i18n/messages";

export function siteContactKoreaAddress(messages: Messages): string {
  return tPath(messages, "siteContact.korea.address");
}

export function siteContactKoreaPhone(messages: Messages): string {
  return tPath(messages, "siteContact.korea.phone");
}

export function siteContactKoreaEmail(messages: Messages): string {
  void messages;
  return process.env.KOREA_CONTACT_EMAIL?.trim() ?? "";
}

export function siteContactPhilippinesAddressShort(messages: Messages): string {
  return tPath(messages, "siteContact.philippines.addressShort");
}

export function siteContactPhilippinesAddressFull(messages: Messages): string {
  return tPath(messages, "siteContact.philippines.addressFull");
}

export function siteContactPhilippinesPhone(messages: Messages): string {
  return tPath(messages, "siteContact.philippines.phone");
}

export function siteContactPhilippinesPhoneViber(messages: Messages): string {
  return tPath(messages, "siteContact.philippines.phoneViber");
}

export function siteContactPhilippinesEmail(messages: Messages): string {
  void messages;
  return process.env.PHILIPPINES_CONTACT_EMAIL?.trim() ?? "";
}
