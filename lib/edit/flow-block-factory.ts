// 서비스 섹션 flow 블록 생성
import { emptyLocaleTextValues } from "@/lib/edit/locale-helpers";
import { flowImageKey } from "@/lib/edit/image-registry";
import { getActiveLocaleIds } from "@/lib/site-locales";
import type { FlowBlock, FlowBlockInsertType } from "@/lib/edit/section-flow";

let blockSeq = 0;

function nextBlockId(): string {
  blockSeq += 1;
  return `${Date.now().toString(36)}${blockSeq}`;
}

export type CreateFlowBlockOptions = {
  ctaEditKey?: string;
  ctaLabel?: string;
  sourceBlocks?: FlowBlock[];
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
        textKey: `${sectionKey}.flowText.${id}.p`,
      };
    case "heading":
      return {
        type: "heading",
        text: "",
        textKey: `${sectionKey}.flowText.${id}.heading`,
      };
    case "sectionTitle":
      return {
        type: "sectionTitle",
        text: "",
        textKey: `${sectionKey}.flowText.${id}.sectionTitle`,
      };
    case "hr":
      return { type: "hr" };
    case "list":
      return {
        type: "list",
        ordered: false,
        items: [""],
        listKey: `${sectionKey}.flow.${id}.list`,
      };
    case "button":
      return {
        type: "button",
        text: options.ctaLabel ?? "",
        textKey: options.ctaEditKey ?? `${sectionKey}.flow.${id}.button`,
      };
    case "img": {
      const editKey = flowImageKey(sectionKey, id);
      return {
        type: "img",
        editKey,
        src: "",
        alt: "",
      };
    }
    default:
      return {
        type: "p",
        text: "",
        textKey: `${sectionKey}.flowText.${id}.p`,
      };
  }
}

export function draftEntryForNewFlowBlock(block: FlowBlock) {
  if (
    block.type === "p" ||
    block.type === "heading" ||
    block.type === "sectionTitle"
  ) {
    return emptyLocaleTextValues();
  }
  if (block.type === "button") {
    const values = emptyLocaleTextValues();
    for (const id of getActiveLocaleIds()) {
      values[id] = block.text || "";
    }
    return values;
  }
  return null;
}

export function arrayDraftForNewFlowBlock(block: FlowBlock) {
  if (block.type !== "list") return null;
  return Object.fromEntries(getActiveLocaleIds().map((id) => [id, [""]]));
}
