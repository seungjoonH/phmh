// 편집 초안 — data-phmh-key 기준 미저장 여부
import type { LocaleTextValues } from "@/lib/edit/client";
import { parseArrayItemKey } from "@/lib/edit/array-item-key";
import { findLinkedDraft } from "@/lib/edit/linked-text-keys";

type PendingState = {
  drafts: Record<string, LocaleTextValues>;
  imageDrafts: Record<string, unknown>;
  hiddenTextKeys: Record<string, true>;
  arrayDrafts: Record<string, unknown>;
};

export function isEditKeyPending(key: string, state: PendingState): boolean {
  if (
    state.drafts[key] ||
    findLinkedDraft(state.drafts, key) ||
    state.imageDrafts[key] ||
    state.hiddenTextKeys[key]
  ) {
    return true;
  }

  // 배열 초안은 미리보기용 — 항목별 pending은 drafts[arrayKey.index]만 표시
  if (parseArrayItemKey(key)) {
    return false;
  }

  if (state.arrayDrafts[key]) {
    return true;
  }

  return false;
}
