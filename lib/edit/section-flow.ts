// 서비스 섹션 본문 — 통합 flow 블록 직렬화·역직렬화
import type { ContentSubsection, ListBlock } from "@/components/ui/ServiceSection";
import type { ListTree } from "@/lib/edit/list-tree";
import { normalizeListTree } from "@/lib/edit/list-tree";
import { paragraphsToFlow } from "@/lib/edit/prose-flow";

export type FlowBlockInsertType =
  | "p"
  | "heading"
  | "sectionTitle"
  | "list"
  | "hr"
  | "button"
  | "img";

export type FlowBlock =
  | { type: "p"; text: string; textKey: string }
  | { type: "heading"; text: string; textKey: string }
  | { type: "sectionTitle"; text: string; textKey: string }
  /** ServiceSection prepend 전용 — locale `*.tagline` (flow 배열에는 저장하지 않음) */
  | { type: "tagline"; text: string; textKey: string }
  | { type: "list"; ordered: boolean; lead?: string; items: ListTree; listKey: string }
  | { type: "hr" }
  | { type: "button"; text: string; textKey: string }
  | { type: "img"; editKey: string; src: string; alt?: string };

/** locale 파일에 저장하는 flow (문구는 textKey·listKey로 조회) */
export type StoredFlowBlock =
  | { type: "p"; textKey: string }
  | { type: "heading"; textKey: string }
  | { type: "sectionTitle"; textKey: string }
  | { type: "list"; listKey: string; ordered: boolean; lead?: string }
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
        type: "list",
        ordered: false,
        items: normalizeListTree(list.items, "dash"),
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
  if (!Array.isArray(subsections)) return [];
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

function normalizeStoredFlowBlock(
  block: StoredFlowBlock | FlowBlock | { type: "bullets"; listKey: string; lead?: string; items?: string[] },
): FlowBlock {
  switch (block.type) {
    case "p":
      return { type: "p", text: "text" in block ? block.text : "", textKey: block.textKey };
    case "heading":
      return {
        type: "heading",
        text: "text" in block ? block.text : "",
        textKey: block.textKey,
      };
    case "sectionTitle":
      return {
        type: "sectionTitle",
        text: "text" in block ? block.text : "",
        textKey: block.textKey,
      };
    case "list":
      return {
        type: "list",
        ordered: Boolean(block.ordered),
        lead: block.lead,
        items:
          "items" in block && block.items?.length
            ? normalizeListTree(block.items, block.ordered ? "decimal-dot" : "dash")
            : [],
        listKey: block.listKey,
      };
    case "bullets":
      return {
        type: "list",
        ordered: false,
        lead: block.lead,
        items:
          "items" in block && block.items?.length
            ? normalizeListTree(block.items, "dash")
            : [],
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

export type FlattenFlowOptions = {
  /** section.flow가 없을 때만 앞에 끼워넣을 블록 (예: 섹션 이미지, 섹션 타이틀) */
  prepend?: FlowBlock[];
};

/** groups/lists/closing/subsections → 편집·DnD용 단일 블록 배열 */
export function flattenSectionToFlow(
  section: SectionContent,
  keyPrefix: string,
  options: FlattenFlowOptions = {},
): FlowBlock[] {
  // `flow: []` 도 의도적 빈 본문 — paragraphs 폴백으로 삭제가 되살아나지 않게 함
  if (Array.isArray(section.flow)) {
    return section.flow.map((b) => normalizeStoredFlowBlock(b as StoredFlowBlock));
  }

  const prefixed = options.prepend ?? [];

  if (section.paragraphs?.length) {
    return [...prefixed, ...paragraphsToFlow(keyPrefix, section.paragraphs)];
  }

  const blocks: FlowBlock[] = [...prefixed];

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

  blocks.push(...flattenSubsections(section.subsections ?? [], keyPrefix));

  (section.closing ?? []).forEach((text, i) => {
    blocks.push({
      type: "p",
      text,
      textKey: `${keyPrefix}.closing.${i}`,
    });
  });

  return blocks;
}

function cloneFlowBlock(block: FlowBlock): FlowBlock {
  if (block.type === "list") {
    return { ...block, items: structuredClone(block.items) };
  }
  return { ...block };
}

export function stripFlowBlockForStorage(block: FlowBlock): StoredFlowBlock {
  switch (block.type) {
    case "p":
      return { type: "p", textKey: block.textKey };
    case "heading":
      return { type: "heading", textKey: block.textKey };
    case "sectionTitle":
      return { type: "sectionTitle", textKey: block.textKey };
    case "list":
      return {
        type: "list",
        listKey: block.listKey,
        ordered: block.ordered,
        lead: block.lead,
      };
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
export function flowBlockLeadKey(block: FlowBlock): string {
  switch (block.type) {
    case "p":
    case "heading":
    case "sectionTitle":
    case "tagline":
    case "button":
      return `${block.type}:${block.textKey}`;
    case "list":
      return `list:${block.listKey}`;
    case "img":
      return `img:${block.editKey}`;
    case "hr":
      return "hr";
  }
}

/**
 * ServiceSection prepend(섹션 타이틀·이미지)는 사용자 mutation 대상이 아니다.
 * draft 에 prepend 와 같은 key 가 어디에든 들어 있으면 모두 제거하고 head 에만 prepend 를 박는다.
 * (이전 버전은 head 만 검사해서 prepend 가 중간에 끼면 중복으로 추가되는 버그가 있었음.)
 */
export function ensurePrependBlocks(
  blocks: FlowBlock[],
  prepend: FlowBlock[],
): FlowBlock[] {
  if (prepend.length === 0) return blocks;
  const prependKeys = new Set<string>();
  for (const p of prepend) prependKeys.add(flowBlockLeadKey(p));
  const cleaned = blocks.filter((b) => !prependKeys.has(flowBlockLeadKey(b)));
  return [...prepend, ...cleaned];
}

/** 저장용 — prepend 와 같은 key 인 블록을 모두 제거 (draft 에 prepend 가 새 들지 않게) */
export function stripPrependBlocks(
  blocks: FlowBlock[],
  prepend: FlowBlock[],
): FlowBlock[] {
  if (prepend.length === 0) return blocks;
  const prependKeys = new Set<string>();
  for (const p of prepend) prependKeys.add(flowBlockLeadKey(p));
  return blocks.filter((b) => !prependKeys.has(flowBlockLeadKey(b)));
}

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
        // 최상위 .closing.N 블록은 closing 배열로 복원
        // subsections 내부 closing(.subsections.K.closing.N)은 해당 없음
        if (/\.closing\.\d+$/.test(block.textKey) && !block.textKey.includes(".subsections.")) {
          flushParagraphs();
          closing.push(block.text);
        } else {
          paragraphBuffer.push(block.text);
        }
        break;
      case "heading":
        flushParagraphs();
        flushList();
        pendingList = { lead: block.text, items: [] };
        break;
      case "list": {
        flushParagraphs();
        if (pendingList && pendingList.items.length === 0) {
          pendingList.items = structuredClone(block.items);
        } else {
          flushList();
          lists.push({ lead: block.lead, items: structuredClone(block.items) });
          pendingList = null;
        }
        break;
      }
      case "sectionTitle":
      case "tagline":
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
  readListTree?: (key: string) => ListTree | undefined,
): FlowBlock[] {
  return blocks.map((block) => {
    if (
      block.type === "p" ||
      block.type === "heading" ||
      block.type === "sectionTitle" ||
      block.type === "tagline"
    ) {
      return { ...block, text: readText(block.textKey) };
    }
    if (block.type === "list") {
      const liveTree = readListTree?.(`${block.listKey}.items`);
      if (liveTree && liveTree.length > 0) {
        return { ...block, items: structuredClone(liveTree) };
      }
      return {
        ...block,
        items: normalizeListTree(
          block.items,
          block.ordered ? "decimal-dot" : "dash",
        ),
      };
    }
    if (block.type === "button") {
      return { ...block, text: readText(block.textKey) };
    }
    return block;
  });
}
