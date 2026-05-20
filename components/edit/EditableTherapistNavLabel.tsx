"use client";

// 상담사 nav 2depth — list.name 과 동기화, 롱프레스 편집
import { useLocale } from "@/components/i18n/LocaleProvider";
import { editTextAttrs } from "@/lib/edit/attrs";
import { isEditMode } from "@/lib/edit/env";
import { useTherapistEditText } from "@/lib/edit/use-therapist-edit-text";
import { therapistListKey } from "@/lib/edit/therapist-edit-key";
import { getTherapistBySlug, pickLocale } from "@/lib/therapists/load";

export function EditableTherapistNavLabel({ slug }: { slug: string }) {
  const { locale } = useLocale();
  const record = getTherapistBySlug(slug);
  const editKey = therapistListKey(slug, "name");
  const committed = record ? pickLocale(record.list.name, locale) : "";
  const label = useTherapistEditText(editKey, committed);

  if (!isEditMode()) {
    return <>{label}</>;
  }

  return (
    <span {...editTextAttrs(editKey, { longPress: true })} className="inline-block">
      {label}
    </span>
  );
}
