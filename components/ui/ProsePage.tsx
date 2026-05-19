"use client";

// Prose 페이지 템플릿
import { Reveal } from "@/components/motion/Reveal";
import { EditArrayAddButton } from "@/components/edit/EditArrayAddButton";
import { EditableStringArraySection } from "@/components/edit/EditableStringArraySection";
import { useEditDraftOptional } from "@/components/edit/EditDraftProvider";
import { editTextAttrs } from "@/lib/edit/attrs";
import { getStringArrayAtPath } from "@/lib/edit/get-message-array";
import { isEditMode } from "@/lib/edit/env";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { MarkupText } from "./MarkupText";
import { PageHeroBanner } from "./PageHeroBanner";

type Props = {
  title: string;
  paragraphs: string[];
  heroSrc: string;
  heroAlt?: string;
  heroPriority?: boolean;
  /** locale 키 prefix (예: pages.whoWeAre) — edit 모드 메타 */
  editKeyPrefix?: string;
  /** 히어로 이미지 편집 키 */
  heroEditKey?: string;
  children?: React.ReactNode;
};

export function ProsePage({
  title,
  paragraphs,
  heroSrc,
  heroAlt = "",
  heroPriority = false,
  editKeyPrefix,
  heroEditKey,
  children,
}: Props) {
  const { messages } = useLocale();
  const edit = useEditDraftOptional();
  const arrayKey = editKeyPrefix ? `${editKeyPrefix}.paragraphs` : undefined;
  const liveParagraphs =
    arrayKey && (isEditMode() || edit)
      ? (getStringArrayAtPath(messages, arrayKey) ?? paragraphs)
      : paragraphs;

  return (
    <article>
      <PageHeroBanner
        src={heroSrc}
        alt={heroAlt}
        priority={heroPriority}
        editKey={heroEditKey}
      />
      <div className="page-container">
        <Reveal>
          <h1
            className="page-title"
            {...(editKeyPrefix ? editTextAttrs(`${editKeyPrefix}.title`) : {})}
          >
            {title}
          </h1>
          <div className="page-title-rule" />
        </Reveal>
        <div className="mx-auto mt-12 max-w-3xl space-y-7 font-body text-lg font-light leading-[1.75] tracking-[0.01em] text-page-body">
          {arrayKey ? (
            <EditableStringArraySection arrayKey={arrayKey} items={liveParagraphs} />
          ) : (
            liveParagraphs.map((p, i) => (
              <Reveal key={i} delay={i * 0.06}>
                <p>
                  <MarkupText as="span">{p}</MarkupText>
                </p>
              </Reveal>
            ))
          )}
          {children ? (
            <Reveal delay={liveParagraphs.length * 0.06}>{children}</Reveal>
          ) : null}
          {arrayKey ? <EditArrayAddButton arrayKey={arrayKey} /> : null}
        </div>
      </div>
    </article>
  );
}
