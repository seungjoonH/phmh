"use client";

// Center 연락처 표시 — 주소·전화·이메일은 siteContact SSOT에서 파생
import type { CenterRecord } from "@/lib/centers/types";
import {
  getCenterContactDetails,
  getCenterContactEditKeys,
} from "@/lib/centers/contact";
import { EditableText } from "@/components/edit/EditableText";
import { pickCenterLocale } from "@/lib/centers/load";
import { centerParkingKey } from "@/lib/edit/center-edit-key";
import { isEditMode } from "@/lib/edit/env";
import type { ContentLocale } from "@/lib/content-blocks/types";
import type { Messages } from "@/lib/i18n/messages";

type Props = {
  center: CenterRecord;
  locale: ContentLocale;
  messages: Messages;
};

export function CenterContactDetails({ center, locale, messages }: Props) {
  const edit = isEditMode();
  const contact = getCenterContactDetails(center.contactRef, messages);
  const contactKeys = getCenterContactEditKeys(center.contactRef);
  const parking = pickCenterLocale(center.parking, locale);
  const extraInfo = pickCenterLocale(center.extraInfo, locale);

  const rows = [
    { label: "TEL", value: contact.phone, editKey: contactKeys.phone },
    { label: "EMAIL", value: contact.email, editKey: contactKeys.email },
    { label: "ADDRESS", value: contact.address, editKey: contactKeys.address },
    { label: "Parking", value: parking, editKey: centerParkingKey(center.slug) },
    ...extraInfo.map((value, index) => ({
      label: `INFO ${index + 1}`,
      value,
      editKey: undefined,
    })),
  ].filter((row) => edit || row.value.trim() !== "");

  return (
    <dl className="space-y-7">
      {rows.map((row) => (
        <div key={row.label}>
          <dt className="text-sm font-semibold uppercase tracking-wide text-page-heading">
            {row.label}
          </dt>
          <EditableText
            as="dd"
            className="mt-2 whitespace-pre-line text-sm leading-6 text-page-body"
            editKey={row.editKey}
          >
            {row.value}
          </EditableText>
        </div>
      ))}
    </dl>
  );
}
