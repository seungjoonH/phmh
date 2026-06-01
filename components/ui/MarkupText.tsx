// **bold**, *italic* locale 문자열 렌더
import { EditEmptyPlaceholder } from "@/components/edit/EditEmptyPlaceholder";
import { isEditMode } from "@/lib/edit/env";
import { renderInlineMarkup } from "@/lib/inline-markup";

type Props = {
  as?: "p" | "span" | "li" | "h3";
  className?: string;
  children: string;
};

function withMultilineClass(className: string | undefined, text: string) {
  const extra = text.includes("\n") ? "whitespace-pre-line" : "";
  if (!className && !extra) return undefined;
  return [className, extra].filter(Boolean).join(" ");
}

export function MarkupText({ as: Tag = "span", className, children }: Props) {
  const mergedClass = withMultilineClass(className, children);
  if (isEditMode() && children.trim() === "") {
    return (
      <Tag className={mergedClass}>
        <EditEmptyPlaceholder />
      </Tag>
    );
  }
  return <Tag className={mergedClass}>{renderInlineMarkup(children)}</Tag>;
}
