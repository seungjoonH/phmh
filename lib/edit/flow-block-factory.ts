// 서비스 섹션 flow 블록 생성
import { emptyLocaleTextValues, newArrayItemValues } from "@/lib/edit/locale-helpers";
import type { FlowBlock, FlowBlockInsertType } from "@/lib/edit/section-flow";

let blockSeq = 0;

function nextBlockId(): string {
  blockSeq += 1;
  return `${Date.now().toString(36)}${blockSeq}`;
}

export type CreateFlowBlockOptions = {
  ctaEditKey?: string;
  ctaLabel?: string;
  imageEditKey?: string;
  imageSrc?: string;
};

export function createFlowBlock(
  sectionKey: string,
  type: FlowBlockInsertType,
  options: CreateFlowBlockOptions = {},
): FlowBlock {
  const id = nextBlockId();

  switch (type) {
    case "p":
      return {
        type: "p",
        text: "",
        textKey: `${sectionKey}.flow.${id}.p`,
      };
    case "heading":
      return {
        type: "heading",
        text: "",
        textKey: `${sectionKey}.flow.${id}.heading`,
      };
    case "hr":
      return { type: "hr" };
    case "bullets":
      return {
        type: "bullets",
        items: [""],
        listKey: `${sectionKey}.flow.${id}.list`,
      };
    case "button":
      return {
        type: "button",
        text: options.ctaLabel ?? "",
        textKey: options.ctaEditKey ?? `${sectionKey}.flow.${id}.button`,
      };
    case "img":
      return {
        type: "img",
        editKey: options.imageEditKey ?? `${sectionKey}.flow.${id}.img`,
        src: options.imageSrc ?? "/services/02.png",
        alt: "",
      };
    default:
      return {
        type: "p",
        text: "",
        textKey: `${sectionKey}.flow.${id}.p`,
      };
  }
}

export function draftEntryForNewFlowBlock(block: FlowBlock) {
  if (block.type === "p" || block.type === "heading") {
    return newArrayItemValues();
  }
  if (block.type === "button") {
    const values = emptyLocaleTextValues();
    const fallback = newArrayItemValues();
    for (const id of Object.keys(values)) {
      values[id] = block.text || fallback[id] || "";
    }
    return values;
  }
  return null;
}

export function arrayDraftForNewFlowBlock(block: FlowBlock) {
  if (block.type !== "bullets") return null;
  const placeholder = newArrayItemValues();
  return Object.fromEntries(
    Object.entries(placeholder).map(([id, text]) => [id, [text]]),
  );
}
