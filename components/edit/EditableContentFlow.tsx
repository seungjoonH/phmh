"use client";

// 서비스 섹션 본문 — p·제목·목록·구분선·이미지·버튼 블록 DnD·추가
import Link from "next/link";
import { Fragment, useEffect, useState } from "react";
import { EditableImage } from "@/components/edit/EditableImage";
import { EditableText } from "@/components/edit/EditableText";
import { EditFlowInsertBar } from "@/components/edit/EditFlowInsertBar";
import { EditInlineControls } from "@/components/edit/EditInlineControls";
import { EditReorderList } from "@/components/edit/EditReorderList";
import { EditReorderRow } from "@/components/edit/EditReorderRow";
import { useDebouncedHoverIndex } from "@/components/edit/useDebouncedHoverIndex";
import { useEditDraftOptional } from "@/components/edit/EditDraftProvider";
import { useEditReorderDrag } from "@/components/edit/useEditReorderDrag";
import { editImageAttrs, editListAttrs, editTextAttrs } from "@/lib/edit/attrs";
import {
  ensureFlowEndsWithCta,
  type FlowBlock,
  type FlowBlockInsertType,
} from "@/lib/edit/section-flow";
import { isEditMode } from "@/lib/edit/env";
import { flowImagePublicPath } from "@/lib/edit/image-registry";
import { useEditText } from "@/lib/edit/use-edit-text";
import { isImageKeyHidden } from "@/lib/image-hidden";
import { MarkupText } from "@/components/ui/MarkupText";

type Props = {
  sectionKey: string;
  blocks: FlowBlock[];
  ctaLabel?: string;
  ctaHref?: string;
  ctaEditKey?: string;
  /** false면 flow 끝 CTA 버튼 블록을 붙이지 않음 */
  appendCta?: boolean;
  /**
   * blocks 의 처음 N 개는 prepend(섹션 헤더 — 이미지·섹션 타이틀).
   * 이 영역은 본문 내에서 이동 불가 → 핸들·인서트바·삭제 컨트롤을 숨긴다.
   * 섹션간 이동은 사이드바에서 처리한다.
   */
  prependCount?: number;
};

// 버튼 블록은 Services / Service Areas 본문에서만 의미가 있다.
// Who We Are 같은 prose 영역에서는 + 메뉴에서 버튼을 노출하지 않는다.
const NON_SERVICE_INSERT_TYPES: readonly FlowBlockInsertType[] = [
  "p",
  "heading",
  "img",
  "hr",
  "list",
];

function isServiceSectionKey(sectionKey: string): boolean {
  return (
    sectionKey.startsWith("services.sections.") ||
    sectionKey.startsWith("serviceAreas.sections.")
  );
}

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

function FlowSectionTitleBlock({
  block,
}: {
  block: Extract<FlowBlock, { type: "sectionTitle" }>;
}) {
  const text = useEditText(block.textKey, block.text);
  return (
    <h2 className="font-logo text-3xl text-page-heading">
      <span className="mr-2 text-secondary">|</span>
      <EditableText as="span" editKey={block.textKey}>
        {text}
      </EditableText>
    </h2>
  );
}

function FlowTaglineBlock({ block }: { block: Extract<FlowBlock, { type: "tagline" }> }) {
  const text = useEditText(block.textKey, block.text);
  return (
    <EditableText
      as="p"
      className="mt-2 text-lg font-medium text-page-heading/90"
      editKey={block.textKey}
    >
      {text}
    </EditableText>
  );
}

function FlowListBlock({ block }: { block: Extract<FlowBlock, { type: "list" }> }) {
  const items = block.items.filter((item) => item.trim() !== "");
  const isEmpty = items.length === 0;
  const attrs = editListAttrs(block.listKey, { longPress: !isEmpty });
  const Tag = block.ordered ? "ol" : "ul";
  const listStyle = block.ordered
    ? "list-decimal space-y-2 pl-6 marker:text-page-body"
    : "list-disc space-y-2 pl-6 marker:text-page-body";
  return (
    <div {...attrs} className="cursor-pointer rounded-sm">
      <Tag className={`${listStyle} w-fit max-w-full`}>
        {isEmpty ? (
          <li>
            <span className="inline-flex h-7 min-w-10 items-center justify-center rounded border border-dashed border-page-body/35 px-2 text-sm leading-none text-page-body/50">
              +
            </span>
          </li>
        ) : (
          items.map((item, i) => (
            <li key={i}>
              <MarkupText as="span">{item.replace(/^([•\-–]|\d+\.)\s*/, "")}</MarkupText>
            </li>
          ))
        )}
      </Tag>
    </div>
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

function FlowImagePlaceholder({ editKey }: { editKey: string }) {
  return (
    <div
      className="relative flex aspect-[16/10] w-full cursor-pointer items-center justify-center overflow-hidden rounded-sm border-2 border-dashed border-page-body/30 bg-page-body/5 text-3xl leading-none text-page-body/45"
      {...editImageAttrs(editKey, { longPress: false })}
      aria-label="이미지 추가"
    >
      +
    </div>
  );
}

function FlowImageBlock({ block }: { block: Extract<FlowBlock, { type: "img" }> }) {
  const edit = useEditDraftOptional();
  const pendingDelete = Boolean(edit?.isImagePendingDelete(block.editKey));
  const hasDraft = Boolean(edit?.imageDrafts[block.editKey]);
  const registrySrc = flowImagePublicPath(block.editKey) ?? "";
  const committedSrc = block.src || registrySrc;
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    setLoadFailed(false);
  }, [block.editKey, committedSrc, hasDraft]);

  if (pendingDelete) {
    return <FlowImagePlaceholder editKey={block.editKey} />;
  }

  const showPlaceholder =
    !hasDraft && !block.src && (!registrySrc || loadFailed);

  if (showPlaceholder) {
    return <FlowImagePlaceholder editKey={block.editKey} />;
  }

  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-sm">
      <EditableImage
        editKey={block.editKey}
        src={committedSrc}
        alt={block.alt ?? ""}
        fill
        className="object-cover"
        onError={() => {
          if (!hasDraft) setLoadFailed(true);
        }}
      />
    </div>
  );
}

function FlowBlockBody({ block, ctaHref }: { block: FlowBlock; ctaHref?: string }) {
  switch (block.type) {
    case "p":
      return <FlowParagraphBlock block={block} />;
    case "heading":
      return <FlowHeadingBlock block={block} />;
    case "sectionTitle":
      return <FlowSectionTitleBlock block={block} />;
    case "tagline":
      return <FlowTaglineBlock block={block} />;
    case "list":
      return <FlowListBlock block={block} />;
    case "hr":
      return (
        <div className="w-full py-6" aria-hidden>
          <div className="border-t border-page-body/15" />
        </div>
      );
    case "button":
      return <FlowButtonBlock block={block} ctaHref={ctaHref} />;
    case "img":
      return <FlowImageBlock block={block} />;
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
    case "sectionTitle":
      return (
        <h2 className="font-logo text-3xl text-page-heading">
          <span className="mr-2 text-secondary">|</span>
          <MarkupText as="span">{block.text}</MarkupText>
        </h2>
      );
    case "tagline":
      return (
        <p className="mt-2 text-lg font-medium text-page-heading/90">
          <MarkupText as="span">{block.text}</MarkupText>
        </p>
      );
    case "list": {
      const items = block.items.filter((item) => item.trim() !== "");
      const Tag = block.ordered ? "ol" : "ul";
      const listStyle = block.ordered
        ? "list-decimal space-y-2 pl-6 marker:text-page-body"
        : "list-disc space-y-2 pl-6 marker:text-page-body";
      return (
        <Tag className={`${listStyle} w-fit max-w-full`}>
          {items.map((item, i) => (
            <li key={i}>
              <MarkupText as="span">{item.replace(/^([•\-–]|\d+\.)\s*/, "")}</MarkupText>
            </li>
          ))}
        </Tag>
      );
    }
    case "hr":
      return (
        <div className="w-full py-6" aria-hidden>
          <div className="border-t border-page-body/15" />
        </div>
      );
    case "button":
      return ctaHref ? (
        <Link href={ctaHref} className="cta-primary inline-block">
          {block.text}
        </Link>
      ) : (
        <span className="cta-primary inline-block">{block.text}</span>
      );
    case "img": {
      if (isImageKeyHidden(block.editKey)) return null;
      const src = block.src || flowImagePublicPath(block.editKey);
      if (!src) return null;
      return (
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={block.alt ?? ""} className="h-full w-full object-cover" />
        </div>
      );
    }
    default:
      return null;
  }
}

function shouldRowBeFullWidth(block: FlowBlock): boolean {
  return (
    block.type === "hr" ||
    block.type === "img" ||
    block.type === "sectionTitle" ||
    block.type === "tagline"
  );
}

export function EditableContentFlow({
  sectionKey,
  blocks,
  ctaLabel,
  ctaHref,
  ctaEditKey,
  appendCta = true,
  prependCount = 0,
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
  /** CTA·prepend 는 표시 전용 — 삭제·이동·삽입은 props.blocks 기준 */
  const mutationBlocks = blocks;

  const [openInsertIndex, setOpenInsertIndex] = useState<number | null>(null);
  const insertTypes = isServiceSectionKey(sectionKey)
    ? undefined
    : NON_SERVICE_INSERT_TYPES;

  const {
    dragIndex,
    dropTarget,
    beginDrag,
    createDropHandler,
    getRowShift,
  } = useEditReorderDrag();

  // 80ms hover-in / 260ms hover-out (= highlight fade 200ms + buffer)
  // 드래그 중에는 hover 가 발동하지 않도록 disabled.
  const { hoveredIndex, scheduleEnter, scheduleLeave } = useDebouncedHoverIndex(
    { inDelayMs: 80, outDelayMs: 260, disabled: dragIndex !== null },
  );

  // bar i 는 row(i-1)의 아래 / row(i)의 위 위치. menu open 시에는 항상 노출.
  // 단, prepend(섹션 헤더) 사이/위의 bar 는 본문 추가 의미가 모호하므로 항상 숨김.
  const isBarVisible = (i: number): boolean => {
    if (i < prependCount) return false;
    if (openInsertIndex === i) return true;
    if (hoveredIndex === null) return false;
    return hoveredIndex === i - 1 || hoveredIndex === i;
  };

  /**
   * + 버튼을 어느 방향(현재 hover 중인 row 의 위/아래) 으로 띄울지 결정.
   * - hoveredIndex === i: bar[i] 는 row[i] 의 "윗 추가" → 위로 (above)
   * - hoveredIndex === i - 1: bar[i] 는 row[i-1] 의 "아랫 추가" → 아래로 (below)
   */
  const barPlacement = (i: number): "above" | "below" => {
    if (hoveredIndex === i - 1) return "below";
    return "above";
  };

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

  createDropHandler((from, insertAt) => {
    return edit.moveFlowBlock(sectionKey, from, insertAt, mutationBlocks);
  });

  const handleInsert = (index: number, type: FlowBlockInsertType) => {
    setOpenInsertIndex(null);
    void edit.insertFlowBlock(sectionKey, index, type, {
      ctaEditKey,
      ctaLabel,
      sourceBlocks: mutationBlocks,
    });
  };

  return (
    <div onMouseLeave={scheduleLeave}>
      {/* row 간격 — 40px gap 으로 + 추가 버튼이 위/아래 row 어디와도 겹치지 않게 충분히 분리 */}
      <EditReorderList className="space-y-10">
        {displayBlocks.map((block, i) => {
          // prepend 영역(섹션 헤더 이미지·섹션 타이틀)은 본문 내에서 이동/삭제 불가.
          const isPrepend = i < prependCount;
          return (
            <Fragment
              key={`${sectionKey}-${i}-${block.type}-${"textKey" in block ? block.textKey : "listKey" in block ? block.listKey : "editKey" in block ? block.editKey : i}`}
            >
              <EditFlowInsertBar
                index={i}
                busy={busy}
                isOpen={openInsertIndex === i}
                visible={isBarVisible(i)}
                placement={barPlacement(i)}
                insertTypes={insertTypes}
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
                  busy={busy}
                  fullWidth={shouldRowBeFullWidth(block)}
                  hideHandle={isPrepend}
                  onDragStart={beginDrag}
                  controls={
                    isPrepend || i >= mutationBlocks.length ? undefined : (
                      <EditInlineControls
                        busy={busy}
                        onDelete={() =>
                          void edit.removeFlowBlock(sectionKey, i, mutationBlocks)
                        }
                      />
                    )
                  }
                >
                  <FlowBlockBody block={block} ctaHref={ctaHref} />
                </EditReorderRow>
              </div>
            </Fragment>
          );
        })}
        <EditFlowInsertBar
          index={displayBlocks.length}
          busy={busy}
          isOpen={openInsertIndex === displayBlocks.length}
          visible={isBarVisible(displayBlocks.length)}
          placement={barPlacement(displayBlocks.length)}
          insertTypes={insertTypes}
          onWrapperMouseEnter={() => {
            const last = displayBlocks.length - 1;
            if (hoveredIndex === last || hoveredIndex === displayBlocks.length)
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
