// Center contactRef를 기존 연락처 SSOT에 연결
import type { Messages } from "@/lib/i18n/messages";
import {
  siteContactKoreaAddress,
  siteContactKoreaEmail,
  siteContactKoreaPhone,
  siteContactPhilippinesAddressShort,
  siteContactPhilippinesEmail,
  siteContactPhilippinesPhone,
} from "@/lib/site-contact";

export type CenterContactDetails = {
  phone: string;
  email: string;
  address: string;
};

export type CenterContactEditKeys = {
  phone: string;
  address: string;
};

export function getCenterContactEditKeys(contactRef: string): CenterContactEditKeys {
  if (contactRef === "philippines") {
    return {
      phone: "siteContact.philippines.phone",
      address: "siteContact.philippines.addressShort",
    };
  }
  if (contactRef === "korea") {
    return {
      phone: "siteContact.korea.phone",
      address: "siteContact.korea.address",
    };
  }
  return {
    phone: `siteContact.${contactRef}.phone`,
    address: `siteContact.${contactRef}.address`,
  };
}

export function getCenterContactDetails(
  contactRef: string,
  messages: Messages,
): CenterContactDetails {
  if (contactRef === "philippines") {
    return {
      phone: siteContactPhilippinesPhone(messages),
      email: siteContactPhilippinesEmail(messages),
      address: siteContactPhilippinesAddressShort(messages),
    };
  }
  if (contactRef === "korea") {
    return {
      phone: siteContactKoreaPhone(messages),
      email: siteContactKoreaEmail(messages),
      address: siteContactKoreaAddress(messages),
    };
  }
  const dynamic = (messages.siteContact as Record<string, unknown> | undefined)?.[
    contactRef
  ] as Record<string, string> | undefined;
  return {
    phone: dynamic?.phone ?? "",
    email: dynamic?.email ?? "",
    address: dynamic?.address ?? dynamic?.addressShort ?? "",
  };
}
