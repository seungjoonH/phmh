// flow 섹션 groups/lists 편집 키 판별·블록에서 textKey 수집
import {
  flowBulletItemEditKey,
  type FlowBlock,
} from "@/lib/edit/section-flow";

const NESTED_GROUP_CELL_KEY = /\.groups\.\d+\.\d+$/;
const FLOW_LIST_KEY = /\.lists\.\d+(?:\.lead|\.items\.\d+)$/;
const FLOW_PARAGRAPH_KEY = /\.paragraphs\.\d+$/;

/** `services.sections.group.groups.1.0` 같은 groups[][] 셀 키 */
export function isNestedGroupCellKey(key: string): boolean {
  return NESTED_GROUP_CELL_KEY.test(key);
}

/** `pages.whoWeAre.lists.0.lead` · `…lists.0.items.1` */
export function isFlowManagedListKey(key: string): boolean {
  return FLOW_LIST_KEY.test(key);
}

/** `pages.whoWeAre.paragraphs.3` — flow 저장 시 paragraphs 배열로 이미 반영 */
export function isFlowManagedParagraphKey(key: string): boolean {
  return FLOW_PARAGRAPH_KEY.test(key);
}

/**
 * 신규 블록 listKey 등 — `section.flow.{id}.list` (locale에 flow 객체 없음)
 * flowText.* 와 구분: `flow.` vs `flowText.`
 */
export function isFlowScopedStorageKey(
  sectionKey: string,
  key: string,
): boolean {
  return key.startsWith(`${sectionKey}.flow.`);
}

/** 이번 저장에 flow 초안이 있는 섹션 — commit-section-flow에서 일괄 반영 */
export function isFlowManagedContentKey(
  key: string,
  flowSectionKeys: ReadonlySet<string>,
): boolean {
  for (const sectionKey of flowSectionKeys) {
    if (!key.startsWith(`${sectionKey}.`)) continue;
    if (isFlowScopedStorageKey(sectionKey, key)) return true;
    if (key.startsWith(`${sectionKey}.groups.`)) return true;
    if (key.startsWith(`${sectionKey}.lists.`)) return true;
    if (key.startsWith(`${sectionKey}.paragraphs.`)) return true;
  }
  return false;
}

/** @deprecated isFlowManagedContentKey 사용 */
export function isFlowManagedGroupCellKey(
  key: string,
  flowSectionKeys: ReadonlySet<string>,
): boolean {
  return isFlowManagedContentKey(key, flowSectionKeys);
}

/** flow 블록 삭제 시 draft·hidden 에서 제거할 텍스트 키 */
export function flowBlockTextKeys(block: FlowBlock): string[] {
  switch (block.type) {
    case "p":
    case "heading":
    case "sectionTitle":
    case "button":
      return [block.textKey];
    case "list": {
      const keys: string[] = [];
      if (block.lead?.trim()) keys.push(`${block.listKey}.lead`);
      block.items.forEach((_, i) => {
        keys.push(flowBulletItemEditKey(block.listKey, i));
      });
      return keys;
    }
    default:
      return [];
  }
}
