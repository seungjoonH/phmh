"use client";

// locale 문자열 배열 — 블록별 순서 변경·삭제·하단 추가
import { Reveal } from "@/components/motion/Reveal";
import { EditableTextBlock } from "@/components/edit/EditableTextBlock";
import { EditInlineControls } from "@/components/edit/EditInlineControls";
import { EditReorderList } from "@/components/edit/EditReorderList";
import { EditReorderRow } from "@/components/edit/EditReorderRow";
import { useEditReorderDrag } from "@/components/edit/useEditReorderDrag";
import { useEditDraftOptional } from "@/components/edit/EditDraftProvider";
import { MarkupText } from "@/components/ui/MarkupText";
import { isEditMode } from "@/lib/edit/env";

type Props = {
  arrayKey: string;
  items: string[];
  revealBaseDelay?: number;
};

export function EditableStringArraySection({
  arrayKey,
  items,
  revealBaseDelay = 0,
}: Props) {
  const edit = useEditDraftOptional();
  const editing = isEditMode() && edit;
  const {
    dragIndex,
    dropTarget,
    beginDrag,
    createDropHandler,
    getRowShift,
  } = useEditReorderDrag();

  if (!editing) {
    return (
      <>
        {items.map((p, i) => (
          <Reveal key={`${arrayKey}-${i}`} delay={revealBaseDelay + i * 0.06}>
            <p>
              <MarkupText as="span">{p}</MarkupText>
            </p>
          </Reveal>
        ))}
      </>
    );
  }

  const busy = edit.arrayBusy === arrayKey;

  createDropHandler((from, insertAt) => {
    return edit.moveArrayItem(arrayKey, from, insertAt);
  });

  return (
    <EditReorderList className="space-y-7">
      {items.map((p, i) => (
        <EditReorderRow
          key={`${arrayKey}-${i}-${p.slice(0, 12)}`}
          index={i}
          dragIndex={dragIndex}
          dropTarget={dropTarget}
          rowShift={getRowShift(i)}
          busy={busy}
          onDragStart={beginDrag}
          controls={
            <EditInlineControls
              busy={busy}
              onDelete={() => void edit.removeArrayItem(arrayKey, i)}
            />
          }
        >
          <EditableTextBlock editKey={`${arrayKey}.${i}`} className="">
            <p>
              <MarkupText as="span">{p}</MarkupText>
            </p>
          </EditableTextBlock>
        </EditReorderRow>
      ))}
    </EditReorderList>
  );
}
