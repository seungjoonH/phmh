// 서비스 섹션 본문 — 통합 flow 블록 직렬화·역직렬화
import type { ContentSubsection, ListBlock } from "@/components/ui/ServiceSection";
import { paragraphsToFlow } from "@/lib/edit/prose-flow";

export type FlowBlockInsertType = "p" | "heading" | "bullets" | "hr" | "button" | "img";

export type FlowBlock =
  | { type: "p"; text: string; textKey: string }
  | { type: "heading"; text: string; textKey: string }
  | { type: "bullets"; lead?: string; items: string[]; listKey: string }
  | { type: "hr" }
  | { type: "button"; text: string; textKey: string }
  | { type: "img"; editKey: string; src: string; alt?: string };

/** locale 파일에 저장하는 flow (문구는 textKey·listKey로 조회) */
export type StoredFlowBlock =
  | { type: "p"; textKey: string }
  | { type: "heading"; textKey: string }
  | { type: "bullets"; listKey: string; lead?: string }
  | { type: "hr" }
  | { type: "button"; textKey: string }
  | { type: "img"; editKey: string; src: string };

export type SectionContent = {
  groups?: string[][];
  lists?: ListBlock[];
  closing?: string[];
  subsections?: ContentSubsection[];
  paragraphs?: string[];
  flow?: StoredFlowBlock[] | FlowBlock[];
};

function flattenLists(lists: ListBlock[], keyPrefix: string): FlowBlock[] {
  const blocks: FlowBlock[] = [];
  lists.forEach((list, li) => {
    const listKey = `${keyPrefix}.lists.${li}`;
    if (list.lead?.trim()) {
      blocks.push({
        type: "heading",
        text: list.lead,
        textKey: `${listKey}.lead`,
      });
    }
    if (list.items.length > 0) {
      blocks.push({
        type: "bullets",
        items: [...list.items],
        listKey,
      });
    }
  });
  return blocks;
}

function flattenSubsections(
  subsections: ContentSubsection[],
  keyPrefix: string,
): FlowBlock[] {
  const blocks: FlowBlock[] = [];
  subsections.forEach((sub, si) => {
    const subPrefix = `${keyPrefix}.subsections.${si}`;
    blocks.push({ type: "hr" });
    if (sub.heading?.trim()) {
      blocks.push({
        type: "heading",
        text: sub.heading,
        textKey: `${subPrefix}.heading`,
      });
    }
    if (sub.groups?.length) {
      sub.groups.forEach((group, gi) => {
        group.forEach((text, i) => {
          blocks.push({
            type: "p",
            text,
            textKey: `${subPrefix}.groups.${gi}.${i}`,
          });
        });
      });
    }
    if (sub.lists?.length) {
      blocks.push(...flattenLists(sub.lists, subPrefix));
    }
    if (sub.closing?.length) {
      sub.closing.forEach((text, i) => {
        blocks.push({
          type: "p",
          text,
          textKey: `${subPrefix}.closing.${i}`,
        });
      });
    }
  });
  return blocks;
}

function normalizeStoredFlowBlock(block: StoredFlowBlock | FlowBlock): FlowBlock {
  switch (block.type) {
    case "p":
      return { type: "p", text: "text" in block ? block.text : "", textKey: block.textKey };
    case "heading":
      return {
        type: "heading",
        text: "text" in block ? block.text : "",
        textKey: block.textKey,
      };
    case "bullets":
      return {
        type: "bullets",
        lead: block.lead,
        items: "items" in block && block.items?.length ? [...block.items] : [""],
        listKey: block.listKey,
      };
    case "button":
      return {
        type: "button",
        text: "text" in block ? block.text : "",
        textKey: block.textKey,
      };
    case "img":
      return {
        type: "img",
        editKey: block.editKey,
        src: block.src,
        alt: "alt" in block ? block.alt : "",
      };
    case "hr":
      return { type: "hr" };
    default:
      return { type: "hr" };
  }
}

/** groups/lists/closing/subsections → 편집·DnD용 단일 블록 배열 */
export function flattenSectionToFlow(section: SectionContent, keyPrefix: string): FlowBlock[] {
  if (section.flow?.length) {
    return section.flow.map((b) => normalizeStoredFlowBlock(b as StoredFlowBlock));
  }

  if (section.paragraphs?.length) {
    return paragraphsToFlow(keyPrefix, section.paragraphs);
  }

  const blocks: FlowBlock[] = [];

  (section.groups ?? []).forEach((group, gi) => {
    group.forEach((text, i) => {
      blocks.push({
        type: "p",
        text,
        textKey: `${keyPrefix}.groups.${gi}.${i}`,
      });
    });
  });

  blocks.push(...flattenLists(section.lists ?? [], keyPrefix));

  (section.closing ?? []).forEach((text, i) => {
    blocks.push({
      type: "p",
      text,
      textKey: `${keyPrefix}.closing.${i}`,
    });
  });

  blocks.push(...flattenSubsections(section.subsections ?? [], keyPrefix));

  return blocks;
}

function cloneFlowBlock(block: FlowBlock): FlowBlock {
  if (block.type === "bullets") {
    return { ...block, items: [...block.items] };
  }
  return { ...block };
}

export function stripFlowBlockForStorage(block: FlowBlock): StoredFlowBlock {
  switch (block.type) {
    case "p":
      return { type: "p", textKey: block.textKey };
    case "heading":
      return { type: "heading", textKey: block.textKey };
    case "bullets":
      return { type: "bullets", listKey: block.listKey, lead: block.lead };
    case "button":
      return { type: "button", textKey: block.textKey };
    case "img":
      return { type: "img", editKey: block.editKey, src: block.src };
    case "hr":
      return { type: "hr" };
    default:
      return { type: "hr" };
  }
}

/** 편집 UI용 — CTA 버튼이 flow 끝에 없으면 기본 블록 추가 */
export function ensureFlowEndsWithCta(
  blocks: FlowBlock[],
  cta: { textKey: string; label: string },
): FlowBlock[] {
  if (blocks.some((b) => b.type === "button")) return blocks;
  return [
    ...blocks,
    { type: "button", text: cta.label, textKey: cta.textKey },
  ];
}

/** flow 블록 순서 → locale 섹션(flow + legacy 필드 동기화) */
export function flowToSectionContent(flow: FlowBlock[]): SectionContent {
  const groups: string[][] = [];
  const lists: ListBlock[] = [];
  const closing: string[] = [];
  let paragraphBuffer: string[] = [];
  let pendingList: ListBlock | null = null;

  const flushParagraphs = () => {
    if (paragraphBuffer.length === 0) return;
    groups.push([...paragraphBuffer]);
    paragraphBuffer = [];
  };

  const flushList = () => {
    if (!pendingList) return;
    lists.push(pendingList);
    pendingList = null;
  };

  for (const block of flow) {
    switch (block.type) {
      case "p":
        flushList();
        paragraphBuffer.push(block.text);
        break;
      case "heading":
        flushParagraphs();
        flushList();
        pendingList = { lead: block.text, items: [] };
        break;
      case "bullets": {
        flushParagraphs();
        if (pendingList && pendingList.items.length === 0) {
          pendingList.items = [...block.items];
        } else {
          flushList();
          lists.push({ lead: block.lead, items: [...block.items] });
          pendingList = null;
        }
        break;
      }
      case "hr":
      case "button":
      case "img":
        flushParagraphs();
        flushList();
        break;
      default:
        break;
    }
  }

  flushParagraphs();
  flushList();

  return {
    flow: flow.map((b) => stripFlowBlockForStorage(cloneFlowBlock(b))),
    groups,
    lists,
    closing,
  };
}

export function flowBulletItemEditKey(listKey: string, itemIndex: number): string {
  return `${listKey}.items.${itemIndex}`;
}

/** flow 블록 문구를 locale 메시지·텍스트 초안에서 채움 */
export function hydrateFlowBlocks(
  blocks: FlowBlock[],
  readText: (key: string) => string,
): FlowBlock[] {
  return blocks.map((block) => {
    if (block.type === "p" || block.type === "heading") {
      return { ...block, text: readText(block.textKey) };
    }
    if (block.type === "bullets") {
      return {
        ...block,
        items: block.items.map((item, i) => {
          const live = readText(flowBulletItemEditKey(block.listKey, i));
          return live !== "" ? live : item;
        }),
      };
    }
    if (block.type === "button") {
      return { ...block, text: readText(block.textKey) };
    }
    return block;
  });
}
