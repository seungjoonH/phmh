"use client";

// 본문 flow 편집 — Prose·body 섹션 공통 래퍼
import { EditableContentFlow } from "@/components/edit/EditableContentFlow";
import { useEditDraftOptional } from "@/components/edit/EditDraftProvider";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { isEditMode } from "@/lib/edit/env";
import { proseFallbackSection, type ProseSectionContent } from "@/lib/edit/prose-flow";
import {
  flattenSectionToFlow,
  hydrateFlowBlocks,
} from "@/lib/edit/section-flow";
import { tPath } from "@/lib/i18n/messages";

type Props = {
  sectionKey: string;
  fallbackSection: ProseSectionContent;
  className?: string;
  ctaLabel?: string;
  ctaHref?: string;
  ctaEditKey?: string;
  appendCta?: boolean;
};

function sectionFromMessages(
  messages: Record<string, unknown>,
  sectionKey: string,
  fallback: ProseSectionContent,
): ProseSectionContent {
  const parts = sectionKey.split(".");
  let current: unknown = messages;
  for (const part of parts) {
    if (current === null || typeof current !== "object") return fallback;
    current = (current as Record<string, unknown>)[part];
  }
  return (current ?? fallback) as ProseSectionContent;
}

export function EditableBodyFlow({
  sectionKey,
  fallbackSection,
  className,
  ctaLabel,
  ctaHref,
  ctaEditKey,
  appendCta = false,
}: Props) {
  const { messages } = useLocale();
  const edit = useEditDraftOptional();
  const source = sectionFromMessages(
    messages as Record<string, unknown>,
    sectionKey,
    fallbackSection,
  );
  const section = proseFallbackSection(sectionKey, source);

  const blocks =
    isEditMode() && edit
      ? edit.resolveFlowBlocks(sectionKey, section)
      : hydrateFlowBlocks(flattenSectionToFlow(section, sectionKey), (key) =>
          tPath(messages, key),
        );

  return (
    <div className={className}>
      <EditableContentFlow
        sectionKey={sectionKey}
        blocks={blocks}
        ctaLabel={ctaLabel}
        ctaHref={ctaHref}
        ctaEditKey={ctaEditKey}
        appendCta={appendCta}
      />
    </div>
  );
}
