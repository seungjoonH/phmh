"use client";

// 상담사 bullets·header lines — 꾹 눌러 통합 목록 편집
import { editListAttrs } from "@/lib/edit/attrs";
import { isEditMode } from "@/lib/edit/env";
import { useTherapistArrayItems } from "@/lib/edit/use-therapist-array";
import { MarkupText } from "@/components/ui/MarkupText";

type Variant = "card-bullet" | "profile-line";

type Props = {
  arrayKey: string;
  items: string[];
  variant: Variant;
};

export function EditableTherapistStringList({ arrayKey, items, variant }: Props) {
  const edit = isEditMode();
  const displayItems = useTherapistArrayItems(arrayKey, items);
  const isEmpty = displayItems.length === 0;
  const attrs = edit ? editListAttrs(arrayKey, { longPress: !isEmpty }) : {};

  if (variant === "card-bullet") {
    return (
      <ul
        {...attrs}
        className={`space-y-1 text-sm font-light leading-relaxed text-page-body${edit ? " cursor-pointer rounded-sm" : ""}`}
      >
        {isEmpty && edit ? (
          <li className="flex gap-2">
            <span className="text-secondary" aria-hidden>
              –
            </span>
            <span className="inline-flex h-6 min-w-10 items-center justify-center rounded border border-dashed border-page-body/35 px-2 text-sm leading-none text-page-body/50">
              +
            </span>
          </li>
        ) : (
          displayItems.map((item, i) => (
            <li key={`${arrayKey}-${i}`} className="flex gap-2">
              <span className="text-secondary" aria-hidden>
                –
              </span>
              <MarkupText as="span">{item}</MarkupText>
            </li>
          ))
        )}
      </ul>
    );
  }

  return (
    <ul
      {...attrs}
      className={`mt-6 space-y-1 text-center font-body text-base font-medium text-secondary/90${edit ? " cursor-pointer rounded-sm" : ""}`}
    >
      {isEmpty && edit ? (
        <li>
          <span className="inline-flex h-6 min-w-10 items-center justify-center rounded border border-dashed border-page-body/35 px-2 text-sm leading-none text-page-body/50">
            +
          </span>
        </li>
      ) : (
        displayItems.map((item, i) => (
          <li key={`${arrayKey}-${i}`}>
            <MarkupText as="span">{item}</MarkupText>
          </li>
        ))
      )}
    </ul>
  );
}
