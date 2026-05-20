// 상담사 필드 텍스트 — locale 초안 오버레이
import { useEditText } from "@/lib/edit/use-edit-text";
import { isTherapistEditKey } from "@/lib/edit/therapist-edit-key";

export function useTherapistEditText(
  editKey: string | undefined,
  committed: string,
): string {
  const draftText = useEditText(editKey ?? "", committed);
  if (!editKey || !isTherapistEditKey(editKey)) return committed;
  return draftText;
}
