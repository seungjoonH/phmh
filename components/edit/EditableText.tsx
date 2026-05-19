"use client";

// 편집 모드 locale 텍스트 래퍼
import { editTextAttrs } from "@/lib/edit/attrs";
import { isEditMode } from "@/lib/edit/env";
import { EditEmptyPlaceholder } from "@/components/edit/EditEmptyPlaceholder";
import { MarkupText } from "@/components/ui/MarkupText";

type Tag = "p" | "span" | "h1" | "h2" | "h3" | "li";

type Props = {
  editKey?: string;
  as?: Tag;
  className?: string;
  children: React.ReactNode;
  longPress?: boolean;
};

export function EditableText({
  editKey,
  as: Tag = "span",
  className,
  children,
  longPress = true,
}: Props) {
  const attrs =
    editKey && isEditMode() ? editTextAttrs(editKey, { longPress }) : {};

  if (typeof children === "string") {
    const empty = children.trim() === "";
    return (
      <Tag className={className} {...attrs}>
        {empty && editKey && isEditMode() ? (
          <EditEmptyPlaceholder />
        ) : (
          <MarkupText as="span">{children}</MarkupText>
        )}
      </Tag>
    );
  }

  return (
    <Tag className={className} {...attrs}>
      {children}
    </Tag>
  );
}
