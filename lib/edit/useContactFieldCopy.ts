"use client";

// Contact 폼 필드 문구 + 편집 초안 병합
import { useEditDraftOptional } from "@/components/edit/EditDraftProvider";
import {
  getContactFieldCopy,
  getContactFormUi,
  type ContactFormLocaleKey,
} from "@/lib/contact-form-schema";

function draftValue(
  drafts: Record<string, Partial<Record<ContactFormLocaleKey, string>>>,
  key: string,
  locale: ContactFormLocaleKey,
): string | undefined {
  return drafts[key]?.[locale];
}

export function useContactFieldLabel(
  locale: ContactFormLocaleKey,
  fieldId: string,
): string {
  const edit = useEditDraftOptional();
  const key = `contactForm.fields.${fieldId}.label`;
  const draft = edit ? draftValue(edit.drafts, key, locale) : undefined;
  if (draft !== undefined) return draft;
  return getContactFieldCopy(locale, fieldId)?.label ?? fieldId;
}

export function useContactFieldPlaceholder(
  locale: ContactFormLocaleKey,
  fieldId: string,
): string | undefined {
  const edit = useEditDraftOptional();
  const key = `contactForm.fields.${fieldId}.placeholder`;
  const draft = edit ? draftValue(edit.drafts, key, locale) : undefined;
  if (draft !== undefined) return draft;
  return getContactFieldCopy(locale, fieldId)?.placeholder;
}

type FormUiKey =
  | "submit"
  | "sending"
  | "error"
  | "openCalendar"
  | "residencyConfirmTitle"
  | "residencyConfirmMessage"
  | "residencyConfirmConfirm"
  | "residencyConfirmCancel"
  | "residencyKorea"
  | "residencyPhilippines";

export function useContactFormUi(
  locale: ContactFormLocaleKey,
  formKey: FormUiKey,
): string {
  const edit = useEditDraftOptional();
  const key = `contactForm.form.${formKey}`;
  const draft = edit ? draftValue(edit.drafts, key, locale) : undefined;
  if (draft !== undefined) return draft;
  return getContactFormUi(locale, formKey);
}
