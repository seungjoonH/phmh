"use client";

// Getting Started — 동일 포맷 스텝 카드 그리드 추가·이동·편집·삭제
import { RevealStagger, RevealStaggerItem } from "@/components/motion/RevealStagger";
import { EditableText } from "@/components/edit/EditableText";
import { EditAddLink } from "@/components/edit/EditAddLink";
import { EditInlineControls } from "@/components/edit/EditInlineControls";
import { EditReorderList } from "@/components/edit/EditReorderList";
import { EditReorderRow } from "@/components/edit/EditReorderRow";
import { useEditDraftOptional } from "@/components/edit/EditDraftProvider";
import { useEditReorderDrag } from "@/components/edit/useEditReorderDrag";
import type { GettingStartedStep } from "@/lib/edit/getting-started-step";
import { isEditMode } from "@/lib/edit/env";

type Props = {
  arrayKey: string;
  steps: GettingStartedStep[];
};

function StepCard({
  step,
  index,
  arrayKey,
}: {
  step: GettingStartedStep;
  index: number;
  arrayKey: string;
}) {
  return (
    <div className="flex min-h-[8.5rem] flex-col text-left">
      <p className="text-sm font-bold tracking-wide text-secondary">
        Step {step.number}
      </p>
      <EditableText
        as="p"
        className="mt-2 font-logo text-xl text-page-heading md:text-2xl"
        editKey={`${arrayKey}.${index}.title`}
      >
        {step.title}
      </EditableText>
      <div className="my-4 h-0.5 w-10 shrink-0 bg-page-heading/40" aria-hidden />
      <EditableText
        as="p"
        className="text-sm leading-relaxed text-page-body/80 md:text-base"
        editKey={`${arrayKey}.${index}.description`}
      >
        {step.description}
      </EditableText>
    </div>
  );
}

export function EditableGettingStartedSteps({ arrayKey, steps }: Props) {
  const edit = useEditDraftOptional();
  const editing = isEditMode() && edit;
  const {
    dragIndex,
    dropTarget,
    setDragIndex,
    pickDropTarget,
    createDropHandler,
  } = useEditReorderDrag({ axis: "x" });

  if (!editing) {
    return (
      <RevealStagger className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-y-14">
        {steps.map((step, index) => (
          <RevealStaggerItem
            key={`${step.number}-${index}`}
            className="flex min-h-[8.5rem] flex-col text-left"
          >
            <p className="text-sm font-bold tracking-wide text-secondary">
              Step {step.number}
            </p>
            <EditableText
              as="p"
              className="mt-2 font-logo text-xl text-page-heading md:text-2xl"
              editKey={`${arrayKey}.${index}.title`}
            >
              {step.title}
            </EditableText>
            <div
              className="my-4 h-0.5 w-10 shrink-0 bg-page-heading/40"
              aria-hidden
            />
            <EditableText
              as="p"
              className="text-sm leading-relaxed text-page-body/80 md:text-base"
              editKey={`${arrayKey}.${index}.description`}
            >
              {step.description}
            </EditableText>
          </RevealStaggerItem>
        ))}
      </RevealStagger>
    );
  }

  const busy = edit.stepsBusy === arrayKey;

  const handleDrop = createDropHandler((from, insertAt) => {
    void edit.moveStep(arrayKey, from, insertAt);
  });

  return (
    <div className="mx-auto mt-16 max-w-5xl px-9">
      <EditReorderList
        layout="grid"
        dragIndex={dragIndex}
        pickDropTarget={pickDropTarget}
        onDrop={handleDrop}
        className="grid grid-cols-1 gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-y-14"
      >
        {steps.map((step, i) => (
          <EditReorderRow
            key={`${arrayKey}-${i}-${step.number}`}
            index={i}
            dragIndex={dragIndex}
            dropTarget={dropTarget}
            busy={busy}
            orientation="horizontal"
            className="min-h-[8.5rem] w-full"
            onDragStart={setDragIndex}
            onDropTarget={pickDropTarget}
            onDrop={handleDrop}
            controls={
              <EditInlineControls
                busy={busy}
                onDelete={() => void edit.removeStep(arrayKey, i)}
              />
            }
          >
            <StepCard step={step} index={i} arrayKey={arrayKey} />
          </EditReorderRow>
        ))}
      </EditReorderList>
      <div className="mt-6">
        <EditAddLink
          disabled={busy}
          onClick={() => void edit.insertStep(arrayKey, steps.length)}
          className="text-sm"
        >
          {busy ? "추가 중…" : "+ 스텝 추가"}
        </EditAddLink>
      </div>
    </div>
  );
}
