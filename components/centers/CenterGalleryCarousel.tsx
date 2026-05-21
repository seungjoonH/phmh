"use client";

// Center 상세의 대표 이미지·썸네일 캐러셀
import { useMemo, useState } from "react";
import { CenterHeroMedia } from "@/components/centers/CenterHeroMedia";
import {
  type CenterImageDraftItem,
  useEditDraftOptional,
} from "@/components/edit/EditDraftProvider";
import { EditReorderList } from "@/components/edit/EditReorderList";
import { EditReorderRow } from "@/components/edit/EditReorderRow";
import { useEditReorderDrag } from "@/components/edit/useEditReorderDrag";
import type { CenterRecord } from "@/lib/centers/types";
import type { ContentLocale } from "@/lib/content-blocks/types";
import { pickCenterLocale } from "@/lib/centers/load";
import { centerImagesEditKey } from "@/lib/edit/center-edit-key";
import { isEditMode } from "@/lib/edit/env";

type Props = {
  center: CenterRecord;
  locale: ContentLocale;
};

export function CenterGalleryCarousel({ center, locale }: Props) {
  const edit = isEditMode();
  const editCtx = useEditDraftOptional();
  const [busy, setBusy] = useState(false);
  const baselineImages = useMemo<CenterImageDraftItem[]>(
    () => center.gallery,
    [center.gallery],
  );
  const draft = editCtx?.getCenterImagesDraft(center.slug);
  const actualImages = draft?.items ?? baselineImages;
  const images = useMemo<CenterImageDraftItem[]>(
    () => (actualImages.length > 0 ? actualImages : [{ id: "default", src: "" }]),
    [actualImages],
  );
  const [index, setIndex] = useState(0);
  const active = images[Math.min(index, images.length - 1)] ?? images[0];
  const activeIsRealImage = Boolean(active && active.id !== "default");
  const galleryAlt = pickCenterLocale(center.imageAlt.gallery, locale);
  const heroAlt = pickCenterLocale(center.imageAlt.hero, locale);
  const activeAlt = active?.id === "default" ? heroAlt : galleryAlt[active?.id ?? ""] ?? heroAlt;
  const canSlide = images.length > 1;
  const imageEditKey = centerImagesEditKey(center.slug);
  const {
    dragIndex,
    dropTarget,
    beginDrag,
    createDropHandler,
    getRowShift,
  } = useEditReorderDrag({ axis: "x" });

  const move = (delta: number) => {
    if (!canSlide) return;
    setIndex((current) => (current + delta + images.length) % images.length);
  };

  const nextGallerySlotId = () => {
    const nums = actualImages
      .map((image) => /^(\d+)$/.exec(image.id)?.[1])
      .filter((value): value is string => Boolean(value))
      .map(Number);
    const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
    return String(next).padStart(2, "0");
  };

  const applyImagesDraft = (items: CenterImageDraftItem[]) => {
    editCtx?.setCenterImagesDraft(center.slug, { baseline: baselineImages, items });
  };

  const uploadGalleryImage = async (file: File) => {
    setBusy(true);
    try {
      const safeExt =
        file.type === "image/jpeg" ? "jpg" : file.type === "image/webp" ? "webp" : "png";
      const id = nextGallerySlotId();
      const publicPath = `/centers/${center.slug}/gallery/${id}.${safeExt}`;
      applyImagesDraft([
        ...actualImages,
        {
          id,
          src: publicPath,
          file,
          previewUrl: URL.createObjectURL(file),
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const promoteActive = async () => {
    if (!active || !activeIsRealImage || index === 0) return;
    setBusy(true);
    try {
      const next = [...actualImages];
      const [moved] = next.splice(index, 1);
      next.unshift(moved);
      applyImagesDraft(next);
      setIndex(0);
    } finally {
      setBusy(false);
    }
  };

  const deleteActive = async () => {
    if (!active || !activeIsRealImage) return;
    setBusy(true);
    try {
      const next = actualImages.filter((image) => image.id !== active.id);
      applyImagesDraft(next);
      setIndex((current) => Math.max(0, Math.min(current, next.length - 1)));
    } finally {
      setBusy(false);
    }
  };

  createDropHandler((from, insertAt) => {
    if (actualImages.length <= 1) return;
    const next = [...actualImages];
    const [moved] = next.splice(from, 1);
    const target = insertAt > from ? insertAt - 1 : insertAt;
    next.splice(target, 0, moved);
    setBusy(true);
    applyImagesDraft(next);
    setIndex(Math.max(0, target));
    setBusy(false);
  });

  const deleteAll = async () => {
    if (actualImages.length === 0) return;
    setBusy(true);
    try {
      applyImagesDraft([]);
      setIndex(0);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      className="mx-auto max-w-4xl"
      aria-label={heroAlt}
      data-phmh-key={imageEditKey}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") move(-1);
        if (event.key === "ArrowRight") move(1);
      }}
    >
      <div className="relative overflow-hidden rounded-lg bg-page-body/5">
        <CenterHeroMedia
          src={active?.previewUrl ?? active?.src ?? center.hero}
          alt={activeAlt}
          defaultHero={active?.id === "default"}
          className="aspect-[16/10] w-full object-cover"
        />
        {canSlide ? (
          <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-between px-3">
            <button
              type="button"
              className="interactive-button flex size-10 items-center justify-center rounded-full bg-page-bg/85 text-xl text-page-heading shadow"
              onClick={() => move(-1)}
              aria-label="Previous center image"
            >
              ‹
            </button>
            <button
              type="button"
              className="interactive-button flex size-10 items-center justify-center rounded-full bg-page-bg/85 text-xl text-page-heading shadow"
              onClick={() => move(1)}
              aria-label="Next center image"
            >
              ›
            </button>
          </div>
        ) : null}
      </div>

      {images.length > 1 ? (
        <EditReorderList className="mt-3 flex gap-3 overflow-x-auto pb-1">
          {images.map((image, i) => (
            <EditReorderRow
              key={image.id}
              index={i}
              dragIndex={dragIndex}
              dropTarget={dropTarget}
              rowShift={getRowShift(i)}
              busy={busy}
              orientation="horizontal"
              className="shrink-0"
              handleClassName="absolute -left-1 top-1 z-[70] !border-page-body/40 !bg-page-bg !text-page-heading shadow-md ring-1 ring-page-body/15 hover:!border-page-body/60 hover:!bg-page-bg"
              hideHandle={!edit}
              onDragStart={beginDrag}
            >
              <button
                type="button"
                className={`interactive-button relative h-16 w-24 shrink-0 overflow-hidden rounded-md border ${
                  i === index ? "border-secondary" : "border-page-body/15"
                }`}
                onClick={() => setIndex(i)}
                aria-label={`Show image ${i + 1}`}
              >
                <CenterHeroMedia
                  src={image.previewUrl ?? image.src}
                  alt=""
                  defaultHero={image.id === "default"}
                  className="h-full w-full object-cover"
                />
                {i === 0 ? (
                  <span className="absolute bottom-1 right-1 rounded-sm bg-secondary px-1.5 py-0.5 text-[10px] font-semibold leading-none text-secondary-foreground">
                    대표
                  </span>
                ) : null}
              </button>
            </EditReorderRow>
          ))}
        </EditReorderList>
      ) : null}

      {edit ? (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            className="interactive-button rounded-md border border-page-body/20 px-3 py-2 text-sm font-medium text-secondary hover:bg-page-body/5 disabled:opacity-40"
            disabled={busy || !active || !activeIsRealImage || index === 0}
            onClick={() => void promoteActive()}
          >
            대표 이미지로 설정
          </button>
          <label className="interactive-button inline-flex cursor-pointer items-center rounded-md border border-page-body/20 px-3 py-2 text-sm font-medium text-secondary hover:bg-page-body/5">
            이미지 추가
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              disabled={busy}
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                event.currentTarget.value = "";
                if (file) void uploadGalleryImage(file);
              }}
            />
          </label>
          <button
            type="button"
            className="interactive-button rounded-md border border-page-body/20 px-3 py-2 text-sm font-medium text-page-body hover:bg-page-body/5 disabled:opacity-40"
            disabled={busy || !active || !activeIsRealImage}
            onClick={() => void deleteActive()}
          >
            삭제
          </button>
          <button
            type="button"
            className="interactive-button rounded-md border border-red-500/30 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-500/5 disabled:opacity-40"
            disabled={busy || actualImages.length === 0}
            onClick={() => void deleteAll()}
          >
            전체 삭제
          </button>
        </div>
      ) : null}
    </section>
  );
}
