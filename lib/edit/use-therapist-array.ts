// 상담사 문자열 배열 — arrayDraft 미리보기
import { useEditDraftOptional } from "@/components/edit/EditDraftProvider";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { isTherapistArrayKey } from "@/lib/edit/therapist-edit-key";

export function useTherapistArrayItems(
  arrayKey: string,
  committed: string[],
): string[] {
  const { locale } = useLocale();
  const edit = useEditDraftOptional();
  if (!edit || !isTherapistArrayKey(arrayKey)) return committed;
  const draft = edit.arrayDrafts[arrayKey];
  const fromDraft = draft?.[locale];
  if (Array.isArray(fromDraft)) return fromDraft;
  return committed;
}
