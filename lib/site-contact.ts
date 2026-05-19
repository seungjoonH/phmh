// 연락처 표시 SSOT — locales siteContact.* (편집·미리보기)
import { tPath, type Messages } from "@/lib/i18n/messages";

export function siteContactEmail(messages: Messages): string {
  return tPath(messages, "siteContact.email");
}

export function siteContactKoreaAddress(messages: Messages): string {
  return tPath(messages, "siteContact.korea.address");
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
