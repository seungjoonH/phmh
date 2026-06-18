// Prose·body flow — paragraphs 배열 ↔ flow 블록
import type { ListBlock } from "@/components/ui/ServiceSection";
import { flattenListTreeText, normalizeListTree } from "@/lib/edit/list-tree";
import {
  stripFlowBlockForStorage,
  type FlowBlock,
  type SectionContent,
  type StoredFlowBlock,
} from "@/lib/edit/section-flow";

export type ProseSectionContent = SectionContent & {
  paragraphs?: string[];
};

/** locale `lists` 배열에 넣을 블록만 — 빈 목록 placeholder 는 flow 에만 남김 */
export function listBlocksForLocaleSave(
  lists: ListBlock[] | undefined,
): ListBlock[] {
  return (lists ?? []).filter((list) => {
    if (list.lead?.trim()) return true;
    const flat = flattenListTreeText(normalizeListTree(list.items));
    return flat.some((item) => item.trim().length > 0);
  });
}

export function isProseStyleSectionKey(sectionKey: string): boolean {
  if (
    sectionKey.startsWith("services.sections.") ||
    sectionKey.startsWith("serviceAreas.sections.")
  ) {
    return false;
  }
  if (sectionKey.endsWith(".body")) return true;
  if (sectionKey.startsWith("pages.")) return true;
  if (sectionKey.startsWith("contact.")) return sectionKey.endsWith(".body");
  return false;
}

export function paragraphsToFlow(sectionKey: string, paragraphs: string[]): FlowBlock[] {
  return paragraphs.map((text, i) => ({
    type: "p",
    text,
    textKey: `${sectionKey}.paragraphs.${i}`,
  }));
}

/** legacy `paragraphs.N` textKey (flowText·flow.* 제외) */
export function isLegacyParagraphTextKey(
  sectionKey: string,
  textKey: string,
): boolean {
  const prefix = `${sectionKey}.paragraphs.`;
  return textKey.startsWith(prefix) && !textKey.includes(".flowText.");
}

/** flow 순서대로 legacy 문단 본문만 — flowText 문단은 paragraphs 배열에 넣지 않음 */
export function legacyParagraphTextsFromFlow(
  sectionKey: string,
  flow: FlowBlock[],
): string[] {
  return flow
    .filter(
      (b): b is Extract<FlowBlock, { type: "p" }> =>
        b.type === "p" && isLegacyParagraphTextKey(sectionKey, b.textKey),
    )
    .map((b) => b.text);
}

/** 저장 시 legacy 문단 textKey 를 0..n-1 로 재매핑 */
export function remapLegacyParagraphTextKeys(
  sectionKey: string,
  flow: FlowBlock[],
): FlowBlock[] {
  const prefix = `${sectionKey}.paragraphs.`;
  let index = 0;
  return flow.map((block) => {
    if (block.type !== "p" || !block.textKey.startsWith(prefix)) return block;
    if (block.textKey.includes(".flowText.")) return block;
    const next = { ...block, textKey: `${prefix}${index}` };
    index += 1;
    return next;
  });
}

export function proseFallbackSection(
  sectionKey: string,
  section: ProseSectionContent,
): SectionContent {
  if (Array.isArray(section.flow)) return section;
  if (section.paragraphs?.length) {
    return {
      ...section,
      flow: paragraphsToFlow(sectionKey, section.paragraphs).map((b) =>
        stripFlowBlockForStorage(b),
      ) as StoredFlowBlock[],
    };
  }
  return { ...section, flow: [] };
}

/** flow → paragraphs·lists·flow 저장 형태 */
export function flowToProseSection(flow: FlowBlock[]): ProseSectionContent {
  const paragraphs: string[] = [];
  const lists: ListBlock[] = [];
  let pendingList: ListBlock | null = null;

  const flushList = () => {
    if (!pendingList) return;
    lists.push(pendingList);
    pendingList = null;
  };

  for (const block of flow) {
    switch (block.type) {
      case "p":
        flushList();
        paragraphs.push(block.text);
        break;
      case "heading":
        flushList();
        pendingList = { lead: block.text, items: [] };
        break;
      case "list":
        if (pendingList && pendingList.items.length === 0) {
          pendingList.items = structuredClone(block.items);
        } else {
          flushList();
          lists.push({ lead: block.lead, items: structuredClone(block.items) });
          pendingList = null;
        }
        break;
      case "sectionTitle":
      case "hr":
      case "button":
      case "img":
        flushList();
        break;
      default:
        break;
    }
  }

  flushList();

  return {
    flow: flow.map((b) => stripFlowBlockForStorage(b)),
    paragraphs,
    lists,
    groups: [],
    closing: [],
  };
}
