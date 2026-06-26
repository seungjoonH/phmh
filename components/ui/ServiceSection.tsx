// 롱폼 서비스 섹션 블록
import Link from "next/link";
import { useEffect, useState } from "react";
import { Reveal } from "@/components/motion/Reveal";
import { ParallaxMedia } from "@/components/motion/ParallaxMedia";
import { EditableContentFlow } from "@/components/edit/EditableContentFlow";
import { EditableImage } from "@/components/edit/EditableImage";
import { EditableText } from "@/components/edit/EditableText";
import { useEditDraftOptional } from "@/components/edit/EditDraftProvider";
import { editTextAttrs } from "@/lib/edit/attrs";
import { isEditMode } from "@/lib/edit/env";
import type { FlowBlock, SectionContent } from "@/lib/edit/section-flow";
import type { ListTree } from "@/lib/edit/list-tree";
import { normalizeListTree } from "@/lib/edit/list-tree";
import { MarkupText } from "./MarkupText";
import { NestedList } from "./NestedList";

export type ListBlock = {
  lead?: string;
  items: string[] | ListTree;
};

export type ContentSubsection = {
  heading?: string;
  groups?: string[][];
  lists?: ListBlock[];
  closing?: string[];
};

type Block = {
  heading?: string;
  paragraphs?: string[];
  bullets?: string[];
};

type Props = {
  id: string;
  title: string;
  imageSrc?: string;
  imageAlt?: string;
  tagline?: string;
  intro?: string[];
  groups?: string[][];
  lists?: ListBlock[];
  closing?: string[];
  subsections?: ContentSubsection[];
  blocks?: Block[];
  bullets?: string[];
  ctaLabel: string;
  ctaHref: string;
  /** CTA 문구 locale 키 (롱프레스 편집) */
  ctaEditKey?: string;
  /** 본문 locale prefix (예: services.sections.couples) */
  textKeyPrefix?: string;
  /** 섹션 이미지 편집 키 */
  imageEditKey?: string;
  revealDelay?: number;
};

function stripBulletPrefix(text: string) {
  return text.replace(/^[•\-–]\s*/, "");
}

function renderGroups(groups: string[][], keyPrefix?: string) {
  return groups.map((group, gi) => (
    <div key={`group-${gi}`} className="space-y-3">
      {group.map((p, i) => (
        <EditableText
          key={i}
          as="p"
          editKey={keyPrefix ? `${keyPrefix}.groups.${gi}.${i}` : undefined}
        >
          {p}
        </EditableText>
      ))}
    </div>
  ));
}

function renderLists(lists: ListBlock[], keyPrefix?: string) {
  return lists.map((list, li) => (
    <div key={`list-${li}`} className="space-y-2">
      {list.lead ? (
        <EditableText
          as="p"
          className="font-medium text-page-heading/90"
          editKey={keyPrefix ? `${keyPrefix}.lists.${li}.lead` : undefined}
        >
          {list.lead}
        </EditableText>
      ) : null}
      {list.items.length > 0 && (
        <NestedList tree={normalizeListTree(list.items, "dash")} />
      )}
    </div>
  ));
}

function renderClosing(closing: string[], keyPrefix?: string) {
  if (closing.length === 0) return null;
  return (
    <div className="space-y-3">
      {closing.map((p, i) => (
        <EditableText
          key={i}
          as="p"
          className="whitespace-pre-line"
          editKey={keyPrefix ? `${keyPrefix}.closing.${i}` : undefined}
        >
          {p}
        </EditableText>
      ))}
    </div>
  );
}

function renderSubsections(subsections: ContentSubsection[], keyPrefix?: string) {
  return subsections.map((sub, si) => (
    <div key={`sub-${si}`} className="space-y-8 border-t border-page-body/10 pt-8">
      {sub.heading ? (
        <EditableText
          as="h3"
          className="text-xl font-semibold leading-snug text-page-heading"
          editKey={keyPrefix ? `${keyPrefix}.subsections.${si}.heading` : undefined}
        >
          {sub.heading}
        </EditableText>
      ) : null}
      {sub.groups && sub.groups.length > 0
        ? renderGroups(sub.groups, keyPrefix ? `${keyPrefix}.subsections.${si}` : undefined)
        : null}
      {sub.lists && sub.lists.length > 0
        ? renderLists(sub.lists, keyPrefix ? `${keyPrefix}.subsections.${si}` : undefined)
        : null}
      {sub.closing && sub.closing.length > 0
        ? renderClosing(sub.closing, keyPrefix ? `${keyPrefix}.subsections.${si}` : undefined)
        : null}
    </div>
  ));
}

export function ServiceSection({
  id,
  title,
  imageSrc,
  imageAlt = "",
  tagline,
  intro = [],
  groups = [],
  lists = [],
  closing = [],
  subsections = [],
  blocks = [],
  bullets = [],
  ctaLabel,
  ctaHref,
  ctaEditKey,
  textKeyPrefix,
  imageEditKey,
  revealDelay = 0,
}: Props) {
  const edit = useEditDraftOptional();
  const [headerImageFailed, setHeaderImageFailed] = useState(false);
  const sectionContent: SectionContent = { groups, lists, closing, subsections };
  const hasStructuredContent =
    groups.length > 0 ||
    lists.length > 0 ||
    closing.length > 0 ||
    subsections.length > 0;
  const useFlowLayout =
    Boolean(textKeyPrefix) && hasStructuredContent && Boolean(edit) && isEditMode();

  // 삭제 예약된 섹션 헤더 이미지는 라이브 프리뷰에서 빈 자리로 보여 준다.
  const pendingDelete = Boolean(
    imageEditKey && edit?.isImagePendingDelete(imageEditKey),
  );
  const effectiveImageSrc = pendingDelete ? undefined : imageSrc;

  useEffect(() => {
    setHeaderImageFailed(false);
  }, [effectiveImageSrc, imageEditKey]);

  const prepend: FlowBlock[] = [];
  // 섹션 헤더 이미지(0 or 1) — imageEditKey 가 있는 섹션은 src 가 비어 있어도 placeholder 자리를 둔다.
  // imageEditKey 자체가 없는 섹션(예: 첫 섹션)은 헤더 이미지 자리를 만들지 않는다.
  if (imageEditKey) {
    prepend.push({
      type: "img",
      editKey: imageEditKey,
      src: effectiveImageSrc ?? "",
      alt: imageAlt || title,
    });
  }
  if (textKeyPrefix) {
    prepend.push({
      type: "sectionTitle",
      text: title,
      textKey: `${textKeyPrefix}.title`,
    });
    if (useFlowLayout && tagline) {
      prepend.push({
        type: "tagline",
        text: tagline,
        textKey: `${textKeyPrefix}.tagline`,
      });
    }
  }

  return (
    <section
      id={id}
      className="scroll-mt-28 py-16"
    >
      {!useFlowLayout && effectiveImageSrc && !headerImageFailed ? (
        <ParallaxMedia className="group relative mb-8 aspect-[16/10] w-full overflow-hidden rounded-sm">
          <EditableImage
            editKey={imageEditKey}
            src={effectiveImageSrc}
            alt={imageAlt || title}
            fill
            className="object-cover transition-transform duration-700 ease-calm group-hover:scale-[1.03]"
            onError={() => setHeaderImageFailed(true)}
          />
        </ParallaxMedia>
      ) : null}
      <Reveal delay={revealDelay}>
        {!useFlowLayout ? (
          <h2 className="font-logo text-3xl text-page-heading">
            <span className="mr-2 text-secondary">|</span>
            <EditableText
              as="span"
              editKey={textKeyPrefix ? `${textKeyPrefix}.title` : undefined}
            >
              {title}
            </EditableText>
          </h2>
        ) : null}
        {!useFlowLayout && tagline ? (
          <EditableText
            as="p"
            className="mt-2 text-lg font-medium text-page-heading/90"
            editKey={textKeyPrefix ? `${textKeyPrefix}.tagline` : undefined}
          >
            {tagline}
          </EditableText>
        ) : null}
        <div className="mt-6 space-y-8 font-body font-light leading-[1.75] text-page-body">
          {useFlowLayout && textKeyPrefix && edit ? (
            <EditableContentFlow
              sectionKey={textKeyPrefix}
              blocks={edit.resolveFlowBlocks(textKeyPrefix, sectionContent, {
                prepend,
              })}
              prependCount={prepend.length}
              ctaLabel={ctaLabel}
              ctaHref={ctaHref}
              ctaEditKey={ctaEditKey}
            />
          ) : (
            <>
              {renderGroups(groups, textKeyPrefix)}
              {renderLists(lists, textKeyPrefix)}
              {renderSubsections(subsections, textKeyPrefix)}
              {renderClosing(closing, textKeyPrefix)}
            </>
          )}

          {!hasStructuredContent && intro.length > 0 && (
            <div className="space-y-4">
              {intro.map((p, i) => (
                <EditableText
                  key={`intro-${i}`}
                  as="p"
                  editKey={textKeyPrefix ? `${textKeyPrefix}.intro.${i}` : undefined}
                >
                  {p}
                </EditableText>
              ))}
            </div>
          )}

          {blocks.map((block, bi) => (
            <div key={bi}>
              {block.heading && (
                <h3
                  id={`${id}-${bi}`}
                  className="mt-6 text-xl font-semibold text-page-heading"
                >
                  {block.heading}
                </h3>
              )}
              {block.paragraphs && block.paragraphs.length > 0 && (
                <div className="mt-3 space-y-3">
                  {block.paragraphs.map((p, i) => (
                    <MarkupText key={i} as="p">
                      {p}
                    </MarkupText>
                  ))}
                </div>
              )}
              {block.bullets && block.bullets.length > 0 && (
                <ul className="mt-3 list-disc space-y-2 pl-6 marker:text-page-body">
                  {block.bullets.map((b, i) => (
                    <li key={i}>
                      <MarkupText as="span">{stripBulletPrefix(b)}</MarkupText>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}

          {bullets.length > 0 && (
            <ul className="list-disc space-y-2 pl-6 marker:text-page-body">
              {bullets.map((b, i) => (
                <li key={i}>
                  <MarkupText as="span">{stripBulletPrefix(b)}</MarkupText>
                </li>
              ))}
            </ul>
          )}
        </div>
        {!useFlowLayout ? (
          <Link
            href={ctaHref}
            className="cta-primary mt-8 inline-block"
            {...(ctaEditKey ? editTextAttrs(ctaEditKey, { longPress: true }) : {})}
          >
            {ctaLabel}
          </Link>
        ) : null}
      </Reveal>
    </section>
  );
}
