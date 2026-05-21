// Center 필드 텍스트 초안을 화면에 반영하는 hook
import { useEditText } from "@/lib/edit/use-edit-text";
import { isCenterEditKey } from "@/lib/edit/center-edit-key";

export function useCenterEditText(
  editKey: string | undefined,
  committed: string,
): string {
  const draftText = useEditText(editKey ?? "", committed);
  if (!editKey || !isCenterEditKey(editKey)) return committed;
  return draftText;
}
