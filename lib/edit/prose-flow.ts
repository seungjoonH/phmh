// Prose·body flow — paragraphs 배열 ↔ flow 블록
import type { ListBlock } from "@/components/ui/ServiceSection";
import {
  stripFlowBlockForStorage,
  type FlowBlock,
  type SectionContent,
  type StoredFlowBlock,
} from "@/lib/edit/section-flow";

export type ProseSectionContent = SectionContent & {
  paragraphs?: string[];
};

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

export function proseFallbackSection(
  sectionKey: string,
  section: ProseSectionContent,
): SectionContent {
  if (section.flow?.length) return section;
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
      case "bullets":
        if (pendingList && pendingList.items.length === 0) {
          pendingList.items = [...block.items];
        } else {
          flushList();
          lists.push({ lead: block.lead, items: [...block.items] });
          pendingList = null;
        }
        break;
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
