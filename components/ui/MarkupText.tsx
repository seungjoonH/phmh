// **bold**, *italic* locale 문자열 렌더
import { EditEmptyPlaceholder } from "@/components/edit/EditEmptyPlaceholder";
import { isEditMode } from "@/lib/edit/env";
import { renderInlineMarkup } from "@/lib/inline-markup";

type Props = {
  as?: "p" | "span" | "li" | "h3";
  className?: string;
  children: string;
};

export function MarkupText({ as: Tag = "span", className, children }: Props) {
  if (isEditMode() && children.trim() === "") {
    return (
      <Tag className={className}>
        <EditEmptyPlaceholder />
      </Tag>
    );
  }
  return <Tag className={className}>{renderInlineMarkup(children)}</Tag>;
}
