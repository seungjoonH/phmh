"use client";

// 이미지 교체 패널 — 미리보기 후 저장 시 public/ 반영, 삭제는 pending(저장 시 hidden 처리)
import { useCallback, useEffect, useState } from "react";
import {
  type CenterImageDraftItem,
  useEditDraft,
} from "@/components/edit/EditDraftProvider";
import { EditSidePanel } from "@/components/edit/EditSidePanel";
import { DEFAULT_HERO_DARK, DEFAULT_HERO_LIGHT } from "@/lib/default-hero";
import { fetchImageRegistry } from "@/lib/edit/client";
import { parseCenterDefaultImageKey } from "@/lib/edit/center-edit-key";
import { getImageRegistryEntry } from "@/lib/edit/image-registry";
import { getCenterBySlug } from "@/lib/centers/load";
import {
  DEFAULT_PORTRAIT_DARK,
  DEFAULT_PORTRAIT_LIGHT,
  isTherapistPortraitKey,
  therapistSlugFromPortraitKey,
} from "@/lib/therapists/default-portrait";
import { getTherapistBySlug } from "@/lib/therapists/load";

function ThemedDefaultPreview({ light, dark }: { light: string; dark: string }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={light}
        alt=""
        className="mx-auto max-h-32 w-auto object-contain dark:hidden"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={dark}
        alt=""
        className="mx-auto hidden max-h-32 w-auto object-contain dark:block"
      />
    </>
  );
}

function centerGallerySlotId(
  images: Array<{ id: string }>,
  preferred?: string,
): string {
  if (preferred) return preferred;
  const nums = images
    .map((image) => /^(\d+)$/.exec(image.id)?.[1])
    .filter((value): value is string => Boolean(value))
    .map(Number);
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return String(next).padStart(2, "0");
}

function extFromFile(file: File): string {
  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/webp") return "webp";
  return "png";
}

function CenterDefaultImagePanel({
  slug,
  imageKey,
}: {
  slug: string;
  imageKey: string;
}) {
  const {
    closeEditor,
    getCenterImagesDraft,
    setCenterImagesDraft,
    committing,
  } = useEditDraft();
  const center = getCenterBySlug(slug);
  const baseline: CenterImageDraftItem[] = center?.gallery ?? [];
  const draft = getCenterImagesDraft(slug);
  const items: CenterImageDraftItem[] = draft?.items ?? baseline;
  const first = items[0];
  const [pendingFileName, setPendingFileName] = useState<string | null>(
    first?.file?.name ?? null,
  );

  useEffect(() => {
    setPendingFileName(first?.file?.name ?? null);
  }, [first?.file]);

  if (!center) return null;

  const applyFile = (file: File) => {
    const id = centerGallerySlotId(items, first?.id);
    const src = `/centers/${slug}/gallery/${id}.${extFromFile(file)}`;
    const next = [...items];
    const nextItem = {
      id,
      src,
      file,
      previewUrl: URL.createObjectURL(file),
    };
    if (next.length > 0) next[0] = nextItem;
    else next.unshift(nextItem);
    setPendingFileName(file.name);
    setCenterImagesDraft(slug, { baseline, items: next });
  };

  const handleDelete = () => {
    if (committing || items.length === 0) return;
    setCenterImagesDraft(slug, { baseline, items: items.slice(1) });
    setPendingFileName(null);
  };

  return (
    <EditSidePanel>
      <div className="flex min-h-0 flex-1 flex-col p-5">
        <div className="mb-3 flex shrink-0 items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-page-body/70">
              이미지 편집
            </p>
            <p className="mt-1 break-all font-mono text-xs text-page-body">{imageKey}</p>
            <p className="mt-1 text-xs text-page-body/70">
              public/centers/{slug}/gallery/01.png
            </p>
          </div>
          <button
            type="button"
            onClick={closeEditor}
            className="flex size-7 shrink-0 items-center justify-center rounded text-page-body hover:bg-page-body/10"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        <div className="phmh-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain">
          <div className="rounded border border-page-body/15 bg-page-body/5 p-4">
            {first ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={first.previewUrl ?? first.src}
                alt=""
                className="mx-auto max-h-32 w-auto object-contain"
              />
            ) : (
              <ThemedDefaultPreview light={DEFAULT_HERO_LIGHT} dark={DEFAULT_HERO_DARK} />
            )}
          </div>
          <label className="block cursor-pointer">
            <span className="mb-2 block text-sm font-medium text-page-heading">
              새 이미지 파일
            </span>
            <div className="flex flex-wrap items-center gap-3">
              <span className="input-file-trigger">파일 선택</span>
              <span className="min-w-0 truncate text-sm text-page-body/60">
                {pendingFileName ?? "선택된 파일 없음"}
              </span>
            </div>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.currentTarget.value = "";
                if (file) applyFile(file);
              }}
            />
          </label>
        </div>

        <div className="mt-4 flex shrink-0 items-center justify-between gap-2 border-t border-page-body/10 pt-4">
          <button
            type="button"
            onClick={handleDelete}
            className="rounded px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
            disabled={committing || items.length === 0}
          >
            삭제
          </button>
          <button
            type="button"
            onClick={closeEditor}
            className="rounded px-4 py-2 text-sm text-page-body hover:bg-page-body/10"
            disabled={committing}
          >
            닫기
          </button>
        </div>
      </div>
    </EditSidePanel>
  );
}

export function ImagePropertyPanel() {
  const {
    selected,
    closeEditor,
    imageDrafts,
    setImageDraft,
    revertImageDraft,
    isImagePendingDelete,
    markImageDelete,
    unmarkImageDelete,
    committing,
  } = useEditDraft();

  const key = selected?.kind === "image" ? selected.key : null;
  const centerDefaultSlug = key ? parseCenterDefaultImageKey(key) : null;
  const entry = key ? getImageRegistryEntry(key) : undefined;
  // entry 객체는 동적 키(`flow.*`, `therapy.sec_*` 등)에서 매 렌더마다 새 참조로 반환된다.
  // useEffect deps 에 객체 그대로 두면 무한 루프(리렌더 ↔ effect)로 GET 폭주가 난다.
  const entryFile = entry?.file;
  const entryPublicPath = entry?.publicPath;

  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasChange, setHasChange] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    if (!key || !entryFile || !entryPublicPath) return;
    let cancelled = false;
    setPreviewUrl("");
    setLoading(true);
    setError(null);
    setIsHidden(false);
    const existing = imageDrafts[key];
    if (existing) {
      setPreviewUrl(existing.previewUrl);
      setPendingFile(existing.file);
      setHasChange(true);
      setLoading(false);
      return;
    }

    fetchImageRegistry(key)
      .then((data) => {
        if (cancelled) return;
        if (data.hidden) {
          setPreviewUrl("");
          setIsHidden(true);
        } else {
          setPreviewUrl(`${data.publicPath}?v=${Date.now()}`);
        }
        setPendingFile(null);
        setHasChange(false);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [key, entryFile, entryPublicPath, imageDrafts]);

  const applyFile = useCallback(
    (file: File) => {
      if (!key) return;
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setPendingFile(file);
      setHasChange(true);
      setImageDraft(key, { previewUrl: url, file });
    },
    [key, setImageDraft],
  );

  const handleClose = () => {
    closeEditor();
  };

  const pendingDelete = key ? isImagePendingDelete(key) : false;
  const isPortrait = key ? isTherapistPortraitKey(key) : false;
  const isHero = key ? key.startsWith("heroes.") : false;
  const portraitSlug = key && isPortrait ? therapistSlugFromPortraitKey(key) : null;
  const portraitAlreadyDefault = Boolean(
    portraitSlug && getTherapistBySlug(portraitSlug)?.profile.defaultPortrait,
  );
  // 이미 기본 상태(또는 숨김 처리됨)면 삭제 버튼 비활성화 — 더 지울 게 없음.
  const isAlreadyDefault = isHidden || portraitAlreadyDefault;

  const handleDelete = () => {
    if (!key || committing) return;
    if (hasChange) {
      // 미저장 업로드 드래프트만 폐기 — 디스크 이미지는 그대로 둔다
      revertImageDraft(key);
      return;
    }
    if (pendingDelete) {
      unmarkImageDelete(key);
      return;
    }
    markImageDelete(key);
  };

  const handleCancel = () => {
    if (!key || committing) return;
    if (hasChange) {
      revertImageDraft(key);
    } else if (pendingDelete) {
      unmarkImageDelete(key);
    }
    closeEditor();
  };

  if (key && centerDefaultSlug) {
    return <CenterDefaultImagePanel slug={centerDefaultSlug} imageKey={key} />;
  }

  if (!key || !entry) return null;

  const showThemedPortrait =
    isPortrait && !hasChange && (pendingDelete || portraitAlreadyDefault);
  const showThemedHero = isHero && !hasChange && (pendingDelete || isHidden);

  return (
    <EditSidePanel>
      <div className="flex min-h-0 flex-1 flex-col p-5">
        <div className="mb-3 flex shrink-0 items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-page-body/70">
              이미지 편집
            </p>
            <p className="mt-1 break-all font-mono text-xs text-page-body">{key}</p>
            <p className="mt-1 text-xs text-page-body/70">{entry.file}</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex size-7 shrink-0 items-center justify-center rounded text-page-body hover:bg-page-body/10"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-page-body">불러오는 중…</p>
        ) : (
          <div className="phmh-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain">
            <div className="rounded border border-page-body/15 bg-page-body/5 p-4">
              {showThemedPortrait ? (
                <ThemedDefaultPreview
                  light={DEFAULT_PORTRAIT_LIGHT}
                  dark={DEFAULT_PORTRAIT_DARK}
                />
              ) : showThemedHero ? (
                <ThemedDefaultPreview
                  light={DEFAULT_HERO_LIGHT}
                  dark={DEFAULT_HERO_DARK}
                />
              ) : previewUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={previewUrl}
                  alt=""
                  className="mx-auto max-h-32 w-auto object-contain"
                />
              ) : !previewUrl && (isHidden || pendingDelete) ? (
                <p className="text-center text-sm text-page-body/60">이미지가 없습니다</p>
              ) : (
                <p className="text-center text-sm text-page-body/60">미리보기 없음</p>
              )}
            </div>
            <label className="block cursor-pointer">
              <span className="mb-2 block text-sm font-medium text-page-heading">
                새 이미지 파일
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <span className="input-file-trigger">파일 선택</span>
                <span className="min-w-0 truncate text-sm text-page-body/60">
                  {pendingFile?.name ?? "선택된 파일 없음"}
                </span>
              </div>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) applyFile(file);
                }}
              />
            </label>
          </div>
        )}

        {error ? <p className="mt-3 shrink-0 text-sm text-red-600">{error}</p> : null}
        <div className="mt-4 flex shrink-0 items-center justify-between gap-2 border-t border-page-body/10 pt-4">
          <button
            type="button"
            onClick={handleDelete}
            className="rounded px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
            disabled={loading || committing || (!hasChange && !pendingDelete && isAlreadyDefault)}
          >
            {hasChange
              ? "변경 취소"
              : pendingDelete
                ? "삭제 취소"
                : "삭제"}
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="rounded px-4 py-2 text-sm text-page-body hover:bg-page-body/10"
              disabled={loading || committing}
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="rounded px-4 py-2 text-sm text-page-body hover:bg-page-body/10"
              disabled={committing}
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </EditSidePanel>
  );
}
