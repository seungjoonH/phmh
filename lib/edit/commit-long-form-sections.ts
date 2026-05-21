// 롱폼 섹션 추가·삭제 — locale content 파일 반영
import { patchLongFormSections } from "@/lib/edit/client";
import type { LongFormSectionsDraftEntry } from "@/lib/edit/long-form-section";

export async function commitLongFormSectionDrafts(
  drafts: Record<string, LongFormSectionsDraftEntry>,
): Promise<void> {
  for (const [orderKey, draft] of Object.entries(drafts)) {
    const hasAdds = Object.keys(draft.added).length > 0;
    const hasRemovals = draft.removed.length > 0;
    if (!hasAdds && !hasRemovals) continue;
    await patchLongFormSections({
      orderKey,
      added: hasAdds ? draft.added : undefined,
      removed: hasRemovals ? draft.removed : undefined,
    });
  }
}
