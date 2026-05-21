"use client";

// 편집 모드 상담사 블록 — long-press 사이드 패널용 표시
import { EditableText } from "@/components/edit/EditableText";
import { MarkupText } from "@/components/ui/MarkupText";
import { editListAttrs, editTextAttrs } from "@/lib/edit/attrs";
import { isEditMode } from "@/lib/edit/env";
import type { ContentBlock, ContentLocale } from "@/lib/content-blocks/types";
import { useTherapistArrayItems } from "@/lib/edit/use-therapist-array";
import { useTherapistEditText } from "@/lib/edit/use-therapist-edit-text";
import {
  therapistBlockListItemsArrayKey,
  therapistBlockTextKey,
} from "@/lib/edit/therapist-edit-key";
import { pickLocale } from "@/lib/therapists/load";

const headingClass: Record<number, string> = {
  1: "font-display text-3xl font-medium text-page-title md:text-4xl",
  2: "font-display text-2xl font-medium text-secondary md:text-3xl",
  3: "font-display text-xl font-medium text-secondary",
  4: "text-lg font-medium text-secondary",
  5: "text-base font-medium text-secondary",
  6: "text-sm font-medium uppercase tracking-wide text-secondary",
};

type Props = {
  slug: string;
  block: ContentBlock;
  locale: ContentLocale;
};

export function TherapistBlockEditView({ slug, block, locale }: Props) {
  if (block.type === "heading") {
    return <TherapistHeadingEdit slug={slug} block={block} locale={locale} />;
  }
  if (block.type === "paragraph") {
    return <TherapistParagraphEdit slug={slug} block={block} locale={locale} />;
  }
  return <TherapistListBlockEdit slug={slug} block={block} locale={locale} />;
}

function TherapistHeadingEdit({
  slug,
  block,
  locale,
}: {
  slug: string;
  block: Extract<ContentBlock, { type: "heading" }>;
  locale: ContentLocale;
}) {
  const editKey = therapistBlockTextKey(slug, block.id);
  const text = useTherapistEditText(editKey, pickLocale(block.text, locale));
  const Tag = `h${block.level}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  const attrs = isEditMode() ? editTextAttrs(editKey, { longPress: true }) : {};
  return (
    <Tag className={headingClass[block.level]} {...attrs}>
      <MarkupText as="span">{text}</MarkupText>
    </Tag>
  );
}

function TherapistParagraphEdit({
  slug,
  block,
  locale,
}: {
  slug: string;
  block: Extract<ContentBlock, { type: "paragraph" }>;
  locale: ContentLocale;
}) {
  const editKey = therapistBlockTextKey(slug, block.id);
  const text = useTherapistEditText(editKey, pickLocale(block.text, locale));
  return (
    <p className="font-body text-lg font-light leading-[1.75] tracking-[0.01em] text-page-body">
      <EditableText as="span" editKey={editKey}>
        {text}
      </EditableText>
    </p>
  );
}

function TherapistListBlockEdit({
  slug,
  block,
  locale,
}: {
  slug: string;
  block: Extract<ContentBlock, { type: "list" }>;
  locale: ContentLocale;
}) {
  const arrayKey = therapistBlockListItemsArrayKey(slug, block.id);
  const items = useTherapistArrayItems(arrayKey, pickLocale(block.items, locale));
  const visibleItems = items.filter((item) => item.trim() !== "");
  const isEmpty = visibleItems.length === 0;
  const edit = isEditMode();
  const attrs = edit ? editListAttrs(arrayKey, { longPress: !isEmpty }) : {};
  const Tag = block.ordered ? "ol" : "ul";
  const listClass = block.ordered ? "list-decimal" : "list-disc";
  return (
    <Tag
      {...attrs}
      className={`${listClass} space-y-3 pl-6 font-body text-lg font-light leading-[1.75] text-page-body${
        edit ? " cursor-pointer rounded-sm" : ""
      }`}
    >
      {isEmpty && edit ? (
        <li>
          <span className="inline-flex h-7 min-w-10 items-center justify-center rounded border border-dashed border-page-body/35 px-2 text-sm leading-none text-page-body/50">
            +
          </span>
        </li>
      ) : (
        visibleItems.map((item, i) => (
          <li key={`${block.id}-${i}`}>
            <MarkupText as="span">{item.replace(/^([•\-–]|\d+\.)\s*/, "")}</MarkupText>
          </li>
        ))
      )}
    </Tag>
  );
}
