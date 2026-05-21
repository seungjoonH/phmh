"use client";

// Getting Started — 동일 포맷 스텝 카드 그리드 추가·이동·편집·삭제
import { RevealStagger, RevealStaggerItem } from "@/components/motion/RevealStagger";
import { EditableText } from "@/components/edit/EditableText";
import { EditAddPill } from "@/components/edit/EditAddPill";
import { EditInlineControls } from "@/components/edit/EditInlineControls";
import { EditReorderList } from "@/components/edit/EditReorderList";
import { EditReorderRow } from "@/components/edit/EditReorderRow";
import { useDebouncedHoverIndex } from "@/components/edit/useDebouncedHoverIndex";
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
    beginDrag,
    createDropHandler,
    getRowShift,
  } = useEditReorderDrag({ axis: "x" });
  const { hoveredIndex, scheduleEnter, scheduleLeave } = useDebouncedHoverIndex(
    { inDelayMs: 80, outDelayMs: 260, disabled: dragIndex !== null },
  );

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

  createDropHandler((from, insertAt) => {
    return edit.moveStep(arrayKey, from, insertAt);
  });

  // 마지막 스텝 hover 또는 + 스텝 추가 영역 자체 hover 시 노출.
  const showAdd = hoveredIndex === steps.length - 1 || hoveredIndex === steps.length;

  return (
    <div
      className="mx-auto mt-16 max-w-5xl px-9"
      onMouseLeave={scheduleLeave}
    >
      <EditReorderList className="grid grid-cols-1 gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-y-14">
        {steps.map((step, i) => (
          <div
            key={`${arrayKey}-${i}-${step.number}`}
            onMouseEnter={() => scheduleEnter(i)}
          >
            <EditReorderRow
              index={i}
              dragIndex={dragIndex}
              dropTarget={dropTarget}
              rowShift={getRowShift(i)}
              busy={busy}
              orientation="horizontal"
              className="min-h-[8.5rem] w-full"
              handleClassName="absolute -left-2 top-2 z-10"
              onDragStart={beginDrag}
              controls={
                <EditInlineControls
                  busy={busy}
                  onDelete={() => void edit.removeStep(arrayKey, i)}
                />
              }
            >
              <StepCard step={step} index={i} arrayKey={arrayKey} />
            </EditReorderRow>
          </div>
        ))}
      </EditReorderList>
      {/* h-0 spacer + absolute overlay — layout shift 없이 마지막 카드 아래 떠 있음 */}
      <div
        aria-hidden={!showAdd}
        className="pointer-events-none relative mt-6 h-0"
      >
        <div
          data-edit-hover-bridge
          className="pointer-events-auto absolute -left-12 -top-3 h-6 w-[calc(100%+3rem)]"
          onMouseEnter={() => {
            const last = steps.length - 1;
            if (hoveredIndex === last || hoveredIndex === steps.length) return;
            scheduleEnter(steps.length);
          }}
          aria-hidden
        />
        <div
          data-edit-hover-bridge
          onMouseEnter={() => {
            const last = steps.length - 1;
            if (hoveredIndex === last || hoveredIndex === steps.length) return;
            scheduleEnter(steps.length);
          }}
          className={`pointer-events-auto absolute left-0 top-0 z-30 -translate-y-1/2 transition-opacity duration-200 ease-out ${
            showAdd ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <EditAddPill
            busy={busy}
            label="스텝 추가"
            onClick={() => void edit.insertStep(arrayKey, steps.length)}
          />
        </div>
      </div>
    </div>
  );
}
