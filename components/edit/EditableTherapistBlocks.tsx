"use client";

// 상담사 프로필 blocks — 편집 모드 DnD·추가, 텍스트는 long-press 패널
import { Fragment, useCallback, useState } from "react";
import { ContentBlockStream } from "@/components/content/ContentBlockStream";
import { EditFlowInsertBar } from "@/components/edit/EditFlowInsertBar";
import { EditInlineControls } from "@/components/edit/EditInlineControls";
import { EditReorderList } from "@/components/edit/EditReorderList";
import { EditReorderRow } from "@/components/edit/EditReorderRow";
import { useEditReorderDrag } from "@/components/edit/useEditReorderDrag";
import { TherapistBlockEditView } from "@/components/therapists/TherapistBlockEditView";
import { useLocale } from "@/components/i18n/LocaleProvider";
import type { ContentBlock, ContentBlockInsertType } from "@/lib/content-blocks/types";
import type { FlowBlockInsertType } from "@/lib/edit/section-flow";
import { patchTherapist } from "@/lib/edit/client";
import { isEditMode } from "@/lib/edit/env";
import { setTherapistRuntime } from "@/lib/therapists/runtime";
import type { TherapistRecord } from "@/lib/therapists/types";

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
  const [blocks, setBlocks] = useState(therapist.profile.blocks);
  const [saving, setSaving] = useState(false);
  const [openInsertIndex, setOpenInsertIndex] = useState<number | null>(null);

  const { dragIndex, dropTarget, setDragIndex, pickDropTarget, createDropHandler } =
    useEditReorderDrag();

  const persist = useCallback(
    async (nextBlocks: ContentBlock[]) => {
      setSaving(true);
      try {
        const record: TherapistRecord = {
          ...therapist,
          profile: { ...therapist.profile, blocks: nextBlocks },
        };
        await patchTherapist(therapist.slug, record);
        setBlocks(nextBlocks);
        setTherapistRuntime(therapist.slug, record);
        onSaved?.();
      } finally {
        setSaving(false);
      }
    },
    [therapist, onSaved],
  );

  if (!edit) {
    return <ContentBlockStream blocks={blocks} locale={locale} />;
  }

  const handleDrop = createDropHandler((from, insertAt) => {
    const next = [...blocks];
    const [moved] = next.splice(from, 1);
    const target = insertAt > from ? insertAt - 1 : insertAt;
    next.splice(target, 0, moved);
    void persist(next);
  });

  const mapInsertType = (type: FlowBlockInsertType): ContentBlockInsertType | null => {
    if (type === "p") return "paragraph";
    if (type === "heading") return "heading";
    if (type === "bullets") return "list";
    return null;
  };

  const handleInsert = (index: number, type: FlowBlockInsertType) => {
    const mapped = mapInsertType(type);
    if (!mapped) return;
    setOpenInsertIndex(null);
    const next = [...blocks];
    next.splice(index, 0, emptyBlock(mapped));
    void persist(next);
  };

  return (
    <div className="space-y-2">
      {saving ? (
        <p className="text-xs text-page-body/60">블록 저장 중…</p>
      ) : null}
      <EditReorderList
        dragIndex={dragIndex}
        pickDropTarget={pickDropTarget}
        onDrop={handleDrop}
        className="space-y-2"
      >
        {blocks.map((block, i) => (
          <Fragment key={block.id}>
            <EditFlowInsertBar
              index={i}
              busy={saving}
              canInsertImage={false}
              isOpen={openInsertIndex === i}
              onOpen={setOpenInsertIndex}
              onClose={() => setOpenInsertIndex(null)}
              onInsert={handleInsert}
            />
            <EditReorderRow
              index={i}
              dragIndex={dragIndex}
              dropTarget={dropTarget}
              busy={saving}
              onDragStart={setDragIndex}
              onDropTarget={pickDropTarget}
              onDrop={handleDrop}
              controls={
                <EditInlineControls
                  busy={saving}
                  onDelete={() => void persist(blocks.filter((b) => b.id !== block.id))}
                />
              }
            >
              <TherapistBlockEditView slug={therapist.slug} block={block} locale={locale} />
            </EditReorderRow>
          </Fragment>
        ))}
        <EditFlowInsertBar
          index={blocks.length}
          busy={saving}
          canInsertImage={false}
          isOpen={openInsertIndex === blocks.length}
          onOpen={setOpenInsertIndex}
          onClose={() => setOpenInsertIndex(null)}
          onInsert={handleInsert}
        />
      </EditReorderList>
    </div>
  );
}
