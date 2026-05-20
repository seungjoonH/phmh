"use client";

// 서비스 섹션 본문 — p·제목·불릿·구분선·이미지·버튼 블록 DnD·추가
import Link from "next/link";
import { Fragment, useState } from "react";
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
import { useEditText } from "@/lib/edit/use-edit-text";
import { MarkupText } from "@/components/ui/MarkupText";

type Props = {
  sectionKey: string;
  blocks: FlowBlock[];
  ctaLabel?: string;
  ctaHref?: string;
  ctaEditKey?: string;
  imageEditKey?: string;
  imageSrc?: string;
  /** false면 flow 끝 CTA 버튼 블록을 붙이지 않음 */
  appendCta?: boolean;
};

function FlowParagraphBlock({ block }: { block: Extract<FlowBlock, { type: "p" }> }) {
  const text = useEditText(block.textKey, block.text);
  return (
    <EditableText as="p" editKey={block.textKey}>
      {text}
    </EditableText>
  );
}

function FlowHeadingBlock({ block }: { block: Extract<FlowBlock, { type: "heading" }> }) {
  const text = useEditText(block.textKey, block.text);
  return (
    <EditableText
      as="p"
      className="font-medium text-page-heading/90"
      editKey={block.textKey}
    >
      {text}
    </EditableText>
  );
}

function FlowBulletItem({
  listKey,
  index,
  committed,
}: {
  listKey: string;
  index: number;
  committed: string;
}) {
  const editKey = flowBulletItemEditKey(listKey, index);
  const text = useEditText(editKey, committed.replace(/^[•\-–]\s*/, ""));
  return (
    <EditableText as="span" editKey={editKey}>
      {text}
    </EditableText>
  );
}

function FlowBulletsBlock({ block }: { block: Extract<FlowBlock, { type: "bullets" }> }) {
  return (
    <ul className="list-disc w-fit max-w-full space-y-2 pl-6 marker:text-page-body">
      {block.items.map((item, i) => (
        <li key={i}>
          <FlowBulletItem listKey={block.listKey} index={i} committed={item} />
        </li>
      ))}
    </ul>
  );
}

function FlowButtonBlock({
  block,
  ctaHref,
}: {
  block: Extract<FlowBlock, { type: "button" }>;
  ctaHref?: string;
}) {
  const text = useEditText(block.textKey, block.text);
  const attrs = editTextAttrs(block.textKey, { longPress: true });
  if (ctaHref) {
    return (
      <Link href={ctaHref} className="cta-primary inline-block" {...attrs}>
        <MarkupText as="span">{text}</MarkupText>
      </Link>
    );
  }
  return (
    <span className="cta-primary inline-block" {...attrs}>
      <MarkupText as="span">{text}</MarkupText>
    </span>
  );
}

function FlowBlockBody({ block, ctaHref }: { block: FlowBlock; ctaHref?: string }) {
  switch (block.type) {
    case "p":
      return <FlowParagraphBlock block={block} />;
    case "heading":
      return <FlowHeadingBlock block={block} />;
    case "bullets":
      return <FlowBulletsBlock block={block} />;
    case "hr":
      return <div className="border-t border-page-body/10" aria-hidden />;
    case "button":
      return <FlowButtonBlock block={block} ctaHref={ctaHref} />;
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

function renderBlockReadonly(block: FlowBlock, ctaHref?: string) {
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
        <ul className="list-disc w-fit max-w-full space-y-2 pl-6 marker:text-page-body">
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
      return ctaHref ? (
        <Link href={ctaHref} className="cta-primary inline-block">
          {block.text}
        </Link>
      ) : (
        <span className="cta-primary inline-block">{block.text}</span>
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
  appendCta = true,
}: Props) {
  const edit = useEditDraftOptional();
  const editing = isEditMode() && edit;
  const displayBlocks =
    appendCta && ctaLabel && ctaHref
      ? ensureFlowEndsWithCta(blocks, {
          textKey: ctaEditKey ?? "common.scheduleConsultation",
          label: ctaLabel,
        })
      : blocks;

  const [openInsertIndex, setOpenInsertIndex] = useState<number | null>(null);

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
    setOpenInsertIndex(null);
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
            isOpen={openInsertIndex === i}
            onOpen={setOpenInsertIndex}
            onClose={() => setOpenInsertIndex(null)}
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
            <FlowBlockBody block={block} ctaHref={ctaHref} />
          </EditReorderRow>
        </Fragment>
      ))}
      <EditFlowInsertBar
        index={displayBlocks.length}
        busy={busy}
        canInsertImage={canInsertImage}
        isOpen={openInsertIndex === displayBlocks.length}
        onOpen={setOpenInsertIndex}
        onClose={() => setOpenInsertIndex(null)}
        onInsert={handleInsert}
      />
    </EditReorderList>
  );
}
