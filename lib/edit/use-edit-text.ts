// locale 텍스트 키 — PropertyPanel 초안을 미리보기에 실시간 반영
import { useEditDraftOptional } from "@/components/edit/EditDraftProvider";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { findLinkedDraft } from "@/lib/edit/linked-text-keys";

export function useEditText(
  editKey: string | undefined,
  committed: string,
): string {
  const { locale } = useLocale();
  const edit = useEditDraftOptional();
  if (!editKey || !edit) return committed;
  const entry = findLinkedDraft(edit.drafts, editKey);
  if (!entry) return committed;
  return entry[locale] ?? entry.en ?? committed;
}
