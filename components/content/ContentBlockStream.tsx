// heading·paragraph·list 콘텐츠 블록 렌더
import { Reveal } from "@/components/motion/Reveal";
import { MarkupText } from "@/components/ui/MarkupText";
import type { ContentBlock, ContentLocale } from "@/lib/content-blocks/types";
import { pickLocale } from "@/lib/therapists/load";

type Props = {
  blocks: ContentBlock[];
  locale: ContentLocale;
  className?: string;
};

const headingClass: Record<number, string> = {
  1: "font-display text-3xl font-medium text-page-title md:text-4xl",
  2: "font-display text-2xl font-medium text-secondary md:text-3xl",
  3: "font-display text-xl font-medium text-secondary",
  4: "text-lg font-medium text-secondary",
  5: "text-base font-medium text-secondary",
  6: "text-sm font-medium uppercase tracking-wide text-secondary",
};

export function ContentBlockStream({ blocks, locale, className }: Props) {
  return (
    <div className={className ?? "space-y-7"}>
      {blocks.map((block, i) => (
        <Reveal key={block.id} delay={i * 0.04}>
          <ContentBlockView block={block} locale={locale} />
        </Reveal>
      ))}
    </div>
  );
}

function ContentBlockView({
  block,
  locale,
}: {
  block: ContentBlock;
  locale: ContentLocale;
}) {
  if (block.type === "heading") {
    const Tag = `h${block.level}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
    const text = pickLocale(block.text, locale);
    return <Tag className={headingClass[block.level]}>{text}</Tag>;
  }

  if (block.type === "paragraph") {
    return (
      <p className="font-body text-lg font-light leading-[1.75] tracking-[0.01em] text-page-body">
        <MarkupText as="span">{pickLocale(block.text, locale)}</MarkupText>
      </p>
    );
  }

  const items = pickLocale(block.items, locale);
  return (
    <ul className="list-disc space-y-3 pl-6 font-body text-lg font-light leading-[1.75] text-page-body">
      {items.map((item, i) => (
        <li key={`${block.id}-${i}`}>
          <MarkupText as="span">{item}</MarkupText>
        </li>
      ))}
    </ul>
  );
}

