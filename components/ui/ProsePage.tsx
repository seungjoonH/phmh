"use client";

// Prose 페이지 템플릿
import { Reveal } from "@/components/motion/Reveal";
import { EditableBodyFlow } from "@/components/edit/EditableBodyFlow";
import { editTextAttrs } from "@/lib/edit/attrs";
import { coerceStringArray } from "@/lib/edit/get-message-array";
import { useLocale } from "@/components/i18n/LocaleProvider";
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
  const section =
    editKeyPrefix && messages
      ? (() => {
          const parts = editKeyPrefix.split(".");
          let current: unknown = messages;
          for (const part of parts) {
            if (current === null || typeof current !== "object") return { paragraphs };
            current = (current as Record<string, unknown>)[part];
          }
          const data = current as { paragraphs?: unknown; flow?: unknown };
          return {
            paragraphs: coerceStringArray(data?.paragraphs ?? paragraphs),
            flow: Array.isArray(data?.flow) ? data.flow : undefined,
          };
        })()
      : { paragraphs };

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
        <div className="mx-auto mt-12 max-w-3xl font-body text-lg font-light leading-[1.75] tracking-[0.01em] text-page-body">
          {editKeyPrefix ? (
            <EditableBodyFlow
              sectionKey={editKeyPrefix}
              fallbackSection={{ paragraphs: section.paragraphs }}
            />
          ) : (
            section.paragraphs.map((p, i) => (
              <Reveal key={i} delay={i * 0.06}>
                <p className="mb-7">{p}</p>
              </Reveal>
            ))
          )}
          {children ? <Reveal className="mt-7">{children}</Reveal> : null}
        </div>
      </div>
    </article>
  );
}
