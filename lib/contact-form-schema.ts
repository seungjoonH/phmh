// Contact Us 폼 SSOT — 필드 구조·레이아웃·헬퍼 (문구는 contact-form-locale/en|ko|jp.ts)
import { getContactFormStructure } from "#phmh/contact-form-structure";
import type {
  ContactFieldDefinition,
  ContactFormFieldCopy,
  ContactFormLocaleBlock,
  ContactLayoutItem,
} from "./contact-form-types";
import { contactFormLocaleEn } from "./contact-form-locale/en.js";
import { contactFormLocaleJp } from "./contact-form-locale/jp.js";
import { contactFormLocaleKo } from "./contact-form-locale/ko.js";

export type {
  ContactFieldDefinition,
  ContactFieldType,
  ContactFormFieldCopy,
  ContactFormLocaleBlock,
  ContactLayoutItem,
  ContactMailRender,
} from "./contact-form-types";

export const CONTACT_FORM_META = {
  honeypot: "_gotcha",
  replyToFieldId: "email",
  subjectNameFieldIds: ["firstName", "lastName"] as const,
} as const;

/** locale id (manifest 기준) */
export type ContactFormLocaleKey = string;

/** @deprecated use getContactFormFields() */
export function getContactFormFields(): readonly ContactFieldDefinition[] {
  return getContactFormStructure().fields;
}

/** @deprecated use getContactFormLayout() */
export function getContactFormLayout(): readonly ContactLayoutItem[] {
  return getContactFormStructure().layout;
}

/** locale별 contact 폼 문구 — contact-form-locale/*.js */
export const contactFormI18n: Record<string, ContactFormLocaleBlock> = {
  en: contactFormLocaleEn,
  ko: contactFormLocaleKo,
  jp: contactFormLocaleJp,
};

export function registerContactFormLocale(id: string, block: ContactFormLocaleBlock) {
  contactFormI18n[id] = block;
}

export type ContactFieldId = string;

export function getContactField(id: string): ContactFieldDefinition | undefined {
  return getContactFormFields().find((f) => f.id === id);
}

export function getContactFieldsInLayoutOrder(): ContactFieldDefinition[] {
  const ordered: ContactFieldDefinition[] = [];
  const seen = new Set<string>();

  for (const item of getContactFormLayout()) {
    const ids = item.type === "row" ? item.fields : [item.fieldId];
    for (const id of ids) {
      if (seen.has(id)) continue;
      const field = getContactField(id);
      if (field) {
        ordered.push(field);
        seen.add(id);
      }
    }
  }

  return ordered;
}

export function getContactFieldsForMail(): ContactFieldDefinition[] {
  return getContactFieldsInLayoutOrder().filter((f) => f.mail.kind !== "skip");
}

export function getContactFormLocale(locale: ContactFormLocaleKey): ContactFormLocaleBlock {
  const block = contactFormI18n[locale];
  if (!block) {
    throw new Error(`Contact form locale not loaded: ${locale}`);
  }
  return block;
}

export function getContactFieldCopy(
  locale: ContactFormLocaleKey,
  fieldId: string,
): ContactFormFieldCopy | undefined {
  return contactFormI18n[locale].fields[fieldId];
}

export function getFieldOptions(locale: ContactFormLocaleKey, fieldId: string): string[] {
  const copy = getContactFieldCopy(locale, fieldId);
  return copy?.options ? [...copy.options] : [];
}

export function getContactFormUi(
  locale: ContactFormLocaleKey,
  key: keyof ContactFormLocaleBlock["form"],
): string {
  return contactFormI18n[locale].form[key];
}

/** locales/en.js · ko.js · jp.js 에서 contact 블록으로 병합 */
export function buildContactFormMessages(locale: ContactFormLocaleKey) {
  const src = contactFormI18n[locale];
  const f = src.fields;

  return {
    form: {
      firstName: f.firstName.label,
      lastName: f.lastName.label,
      email: f.email.label,
      phone: f.phone.label,
      dateOfBirth: f.dateOfBirth.label,
      dateOfBirthPlaceholder: f.dateOfBirth.placeholder ?? "",
      openCalendar: src.form.openCalendar,
      howCanWeHelp: f.message.label,
      howCanWeHelpPlaceholder: f.message.placeholder ?? "",
      scheduling: f.scheduling.label,
      schedulingPlaceholder: f.scheduling.placeholder ?? "",
      insuranceTypes: f.insurance.label,
      seekingHelp: f.seekingHelp.label,
      othersDetail: f.othersDetail.label,
      consentTitle: f.consent.label,
      consentBody: f.consent.body ?? "",
      consentCheckbox: f.consent.checkbox ?? "",
      submit: src.form.submit,
      sending: src.form.sending,
      error: src.form.error,
    },
    insuranceOptions: [...(f.insurance.options ?? [])],
    seekingHelpOptions: [...(f.seekingHelp.options ?? [])],
  };
}
