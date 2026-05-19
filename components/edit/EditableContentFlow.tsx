"use client";

// 서비스 섹션 본문 — p·제목·불릿·구분선·이미지·버튼 블록 DnD·추가
import Link from "next/link";
import { Fragment } from "react";
import { EditableImage } from "@/components/edit/EditableImage";
import { EditableText } from "@/components/edit/EditableText";
import { EditFlowInsertBar } from "@/components/edit/EditFlowInsertBar";
import { EditInlineControls } from "@/components/edit/EditInlineControls";
import { EditReorderList } from "@/components/edit/EditReorderList";
import { EditReorderRow } from "@/components/edit/EditReorderRow";
import { useEditDraftOptional } from "@/components/edit/EditDraftProvider";
import { useEditReorderDrag } from "@/components/edit/useEditReorderDrag";
import { editTextAttrs } from "@/lib/edit/attrs";
import { getImageRegistryEntry } from "@/lib/edit/image-registry";
import {
  ensureFlowEndsWithCta,
  flowBulletItemEditKey,
  type FlowBlock,
  type FlowBlockInsertType,
} from "@/lib/edit/section-flow";
import { isEditMode } from "@/lib/edit/env";
import { MarkupText } from "@/components/ui/MarkupText";

type Props = {
  sectionKey: string;
  blocks: FlowBlock[];
  ctaLabel: string;
  ctaHref: string;
  ctaEditKey?: string;
  imageEditKey?: string;
  imageSrc?: string;
};

function renderBlockBody(
  block: FlowBlock,
  ctaHref: string,
) {
  switch (block.type) {
    case "p":
      return (
        <EditableText as="p" editKey={block.textKey}>
          {block.text}
        </EditableText>
      );
    case "heading":
      return (
        <EditableText
          as="p"
          className="font-medium text-page-heading/90"
          editKey={block.textKey}
        >
          {block.text}
        </EditableText>
      );
    case "bullets":
      return (
        <ul className="list-disc space-y-2 pl-6 marker:text-page-body">
          {block.items.map((item, i) => (
            <li key={i}>
              <EditableText
                as="span"
                editKey={flowBulletItemEditKey(block.listKey, i)}
              >
                {item.replace(/^[•\-–]\s*/, "")}
              </EditableText>
            </li>
          ))}
        </ul>
      );
    case "hr":
      return <div className="border-t border-page-body/10" aria-hidden />;
    case "button":
      return (
        <Link
          href={ctaHref}
          className="cta-primary inline-block"
          {...editTextAttrs(block.textKey, { longPress: true })}
        >
          {block.text}
        </Link>
      );
    case "img":
      if (!getImageRegistryEntry(block.editKey)) {
        return (
          <p className="text-sm text-page-body/70">
            이미지 키가 등록되지 않았습니다 ({block.editKey})
          </p>
        );
      }
      return (
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-sm">
          <EditableImage
            editKey={block.editKey}
            src={block.src}
            alt={block.alt ?? ""}
            fill
            className="object-cover"
          />
        </div>
      );
    default:
      return null;
  }
}

function renderBlockReadonly(block: FlowBlock, ctaHref: string) {
  switch (block.type) {
    case "p":
      return (
        <p>
          <MarkupText as="span">{block.text}</MarkupText>
        </p>
      );
    case "heading":
      return (
        <p className="font-medium text-page-heading/90">
          <MarkupText as="span">{block.text}</MarkupText>
        </p>
      );
    case "bullets":
      return (
        <ul className="list-disc space-y-2 pl-6 marker:text-page-body">
          {block.items.map((item, i) => (
            <li key={i}>
              <MarkupText as="span">{item.replace(/^[•\-–]\s*/, "")}</MarkupText>
            </li>
          ))}
        </ul>
      );
    case "hr":
      return <div className="border-t border-page-body/10 pt-8" aria-hidden />;
    case "button":
      return (
        <Link href={ctaHref} className="cta-primary inline-block">
          {block.text}
        </Link>
      );
    case "img":
      return (
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={block.src} alt={block.alt ?? ""} className="h-full w-full object-cover" />
        </div>
      );
    default:
      return null;
  }
}

export function EditableContentFlow({
  sectionKey,
  blocks,
  ctaLabel,
  ctaHref,
  ctaEditKey,
  imageEditKey,
  imageSrc,
}: Props) {
  const edit = useEditDraftOptional();
  const editing = isEditMode() && edit;
  const displayBlocks = ensureFlowEndsWithCta(blocks, {
    textKey: ctaEditKey ?? "common.scheduleConsultation",
    label: ctaLabel,
  });

  const {
    dragIndex,
    dropTarget,
    setDragIndex,
    pickDropTarget,
    createDropHandler,
  } = useEditReorderDrag();

  if (!editing) {
    return (
      <div className="space-y-8">
        {displayBlocks.map((block, i) => (
          <div key={`${sectionKey}-ro-${i}`}>{renderBlockReadonly(block, ctaHref)}</div>
        ))}
      </div>
    );
  }

  const busy = edit.flowBusy === sectionKey;
  const canInsertImage = Boolean(imageEditKey && imageSrc && getImageRegistryEntry(imageEditKey));

  const handleDrop = createDropHandler((from, insertAt) => {
    void edit.moveFlowBlock(sectionKey, from, insertAt);
  });

  const handleInsert = (index: number, type: FlowBlockInsertType) => {
    void edit.insertFlowBlock(sectionKey, index, type, {
      ctaEditKey,
      ctaLabel,
      imageEditKey,
      imageSrc,
    });
  };

  return (
    <EditReorderList
      dragIndex={dragIndex}
      pickDropTarget={pickDropTarget}
      onDrop={handleDrop}
      className="space-y-2"
    >
      {displayBlocks.map((block, i) => (
        <Fragment key={`${sectionKey}-${i}-${block.type}-${"textKey" in block ? block.textKey : "listKey" in block ? block.listKey : i}`}>
          <EditFlowInsertBar
            index={i}
            busy={busy}
            canInsertImage={canInsertImage}
            onInsert={handleInsert}
          />
          <EditReorderRow
            index={i}
            dragIndex={dragIndex}
            dropTarget={dropTarget}
            busy={busy}
            onDragStart={setDragIndex}
            onDropTarget={pickDropTarget}
            onDrop={handleDrop}
            controls={
              block.type !== "hr" ? (
                <EditInlineControls
                  busy={busy}
                  onDelete={() => void edit.removeFlowBlock(sectionKey, i)}
                />
              ) : undefined
            }
          >
            {renderBlockBody(block, ctaHref)}
          </EditReorderRow>
        </Fragment>
      ))}
      <EditFlowInsertBar
        index={displayBlocks.length}
        busy={busy}
        canInsertImage={canInsertImage}
        onInsert={handleInsert}
      />
    </EditReorderList>
  );
}
