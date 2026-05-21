// 상담사·페이지 공통 콘텐츠 블록 타입
import type { MessageLocaleKey } from "@/lib/config";

export type ContentLocale = MessageLocaleKey;

export type LocaleMap<T = string> = Record<ContentLocale, T>;

export type HeadingBlock = {
  id: string;
  type: "heading";
  level: 1 | 2 | 3 | 4 | 5 | 6;
  text: LocaleMap;
};

export type ParagraphBlock = {
  id: string;
  type: "paragraph";
  text: LocaleMap;
};

export type ListBlock = {
  id: string;
  type: "list";
  ordered?: boolean;
  items: LocaleMap<string[]>;
};

export type ContentBlock = HeadingBlock | ParagraphBlock | ListBlock;

export type ContentBlockInsertType = "heading" | "paragraph" | "list";

export function isHeadingBlock(b: ContentBlock): b is HeadingBlock {
  return b.type === "heading";
}

export function isParagraphBlock(b: ContentBlock): b is ParagraphBlock {
  return b.type === "paragraph";
}

export function isListBlock(b: ContentBlock): b is ListBlock {
  return b.type === "list";
}
