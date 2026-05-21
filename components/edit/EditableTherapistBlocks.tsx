"use client";

// 상담사 프로필 blocks — 편집 모드 DnD·추가, 텍스트는 long-press 패널
import { Fragment, useCallback, useEffect, useState } from "react";
import { ContentBlockStream } from "@/components/content/ContentBlockStream";
import { useEditDraftOptional } from "@/components/edit/EditDraftProvider";
import { EditFlowInsertBar } from "@/components/edit/EditFlowInsertBar";
import { EditInlineControls } from "@/components/edit/EditInlineControls";
import { EditReorderList } from "@/components/edit/EditReorderList";
import { EditReorderRow } from "@/components/edit/EditReorderRow";
import { useDebouncedHoverIndex } from "@/components/edit/useDebouncedHoverIndex";
import { useEditReorderDrag } from "@/components/edit/useEditReorderDrag";
import { TherapistBlockEditView } from "@/components/therapists/TherapistBlockEditView";
import { useLocale } from "@/components/i18n/LocaleProvider";
import type { ContentBlock, ContentBlockInsertType } from "@/lib/content-blocks/types";
import type { FlowBlockInsertType } from "@/lib/edit/section-flow";
import { isEditMode } from "@/lib/edit/env";
import { getTherapistBySlug } from "@/lib/therapists/load";
import { setTherapistRuntime } from "@/lib/therapists/runtime";
import type { TherapistRecord } from "@/lib/therapists/types";

// 상담사 프로필에서 허용되는 블록 추가 옵션 — 소제목·문단·목록만
const THERAPIST_INSERT_TYPES: readonly FlowBlockInsertType[] = [
  "heading",
  "p",
  "list",
];

type Props = {
  therapist: TherapistRecord;
  onSaved?: () => void;
};

function newBlockId() {
  return `blk-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function emptyBlock(type: ContentBlockInsertType): ContentBlock {
  const id = newBlockId();
  if (type === "heading") {
    return {
      id,
      type: "heading",
      level: 2,
      text: { en: "", ko: "", jp: "" },
    };
  }
  if (type === "list") {
    return {
      id,
      type: "list",
      ordered: false,
      items: { en: [""], ko: [""], jp: [""] },
    };
  }
  return {
    id,
    type: "paragraph",
    text: { en: "", ko: "", jp: "" },
  };
}

export function EditableTherapistBlocks({ therapist, onSaved }: Props) {
  const { locale } = useLocale();
  const edit = isEditMode();
  const editDraft = useEditDraftOptional();
  const [blocks, setBlocks] = useState(therapist.profile.blocks);
  const [openInsertIndex, setOpenInsertIndex] = useState<number | null>(null);

  // 외부 저장/취소 시 runtime/registry 와 local state 를 재동기화.
  useEffect(() => {
    const sync = () => {
      const fresh = getTherapistBySlug(therapist.slug);
      if (fresh) setBlocks(fresh.profile.blocks);
    };
    window.addEventListener("phmh-edit-reverted", sync);
    window.addEventListener("phmh-edit-committed", sync);
    return () => {
      window.removeEventListener("phmh-edit-reverted", sync);
      window.removeEventListener("phmh-edit-committed", sync);
    };
  }, [therapist.slug]);

  const {
    dragIndex,
    dropTarget,
    beginDrag,
    createDropHandler,
    getRowShift,
  } = useEditReorderDrag();

  // 드래그 중에는 hover 가 발동하지 않도록 disabled.
  const { hoveredIndex, scheduleEnter, scheduleLeave } = useDebouncedHoverIndex(
    { inDelayMs: 80, outDelayMs: 260, disabled: dragIndex !== null },
  );

  // bar i 는 row(i-1)의 아래 / row(i)의 위 위치. menu open 시에는 항상 노출.
  const isBarVisible = (i: number): boolean => {
    if (openInsertIndex === i) return true;
    if (hoveredIndex === null) return false;
    return hoveredIndex === i - 1 || hoveredIndex === i;
  };

  // 디스크에 즉시 쓰지 않고 runtime preview 만 갱신 + dirty 표시.
  // 실제 저장은 EditToolbar 의 "저장" 에서 일괄 처리.
  const stage = useCallback(
    (nextBlocks: ContentBlock[]) => {
      const record: TherapistRecord = {
        ...therapist,
        profile: { ...therapist.profile, blocks: nextBlocks },
      };
      setBlocks(nextBlocks);
      setTherapistRuntime(therapist.slug, record);
      editDraft?.markTherapistBlocksDirty(therapist.slug);
      onSaved?.();
    },
    [therapist, editDraft, onSaved],
  );

  if (!edit) {
    return <ContentBlockStream blocks={blocks} locale={locale} />;
  }

  createDropHandler((from, insertAt) => {
    const next = [...blocks];
    const [moved] = next.splice(from, 1);
    const target = insertAt > from ? insertAt - 1 : insertAt;
    next.splice(target, 0, moved);
    stage(next);
  });

  const mapInsertType = (type: FlowBlockInsertType): ContentBlockInsertType | null => {
    if (type === "p") return "paragraph";
    if (type === "heading") return "heading";
    if (type === "list") return "list";
    return null;
  };

  const handleInsert = (index: number, type: FlowBlockInsertType) => {
    const mapped = mapInsertType(type);
    if (!mapped) return;
    setOpenInsertIndex(null);
    const next = [...blocks];
    next.splice(index, 0, emptyBlock(mapped));
    stage(next);
  };

  return (
    <div className="space-y-2" onMouseLeave={scheduleLeave}>
      <EditReorderList className="space-y-10">
        {blocks.map((block, i) => (
          <Fragment key={block.id}>
            <EditFlowInsertBar
              index={i}
              busy={false}
              isOpen={openInsertIndex === i}
              visible={isBarVisible(i)}
              insertTypes={THERAPIST_INSERT_TYPES}
              onWrapperMouseEnter={() => {
                if (hoveredIndex === i - 1 || hoveredIndex === i) return;
                scheduleEnter(Math.max(0, i - 1));
              }}
              onOpen={setOpenInsertIndex}
              onClose={() => setOpenInsertIndex(null)}
              onInsert={handleInsert}
            />
            <div onMouseEnter={() => scheduleEnter(i)}>
              <EditReorderRow
                index={i}
                dragIndex={dragIndex}
                dropTarget={dropTarget}
                rowShift={getRowShift(i)}
                busy={false}
                onDragStart={beginDrag}
                controls={
                  <EditInlineControls
                    busy={false}
                    onDelete={() => stage(blocks.filter((b) => b.id !== block.id))}
                  />
                }
              >
                <TherapistBlockEditView slug={therapist.slug} block={block} locale={locale} />
              </EditReorderRow>
            </div>
          </Fragment>
        ))}
        <EditFlowInsertBar
          index={blocks.length}
          busy={false}
          isOpen={openInsertIndex === blocks.length}
          visible={isBarVisible(blocks.length)}
          insertTypes={THERAPIST_INSERT_TYPES}
          onWrapperMouseEnter={() => {
            const last = blocks.length - 1;
            if (hoveredIndex === last || hoveredIndex === blocks.length)
              return;
            scheduleEnter(Math.max(0, last));
          }}
          onOpen={setOpenInsertIndex}
          onClose={() => setOpenInsertIndex(null)}
          onInsert={handleInsert}
        />
      </EditReorderList>
    </div>
  );
}
