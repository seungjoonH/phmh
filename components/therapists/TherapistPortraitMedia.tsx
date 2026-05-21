"use client";

// 상담사 프로필 사진 — 기본 placeholder 또는 업로드본, 삭제 예약 시 기본으로 라이브 프리뷰
import Image from "next/image";
import { EditableImage } from "@/components/edit/EditableImage";
import { useEditDraftOptional } from "@/components/edit/EditDraftProvider";
import { useEditImageSrc } from "@/components/edit/useEditImageSrc";
import {
  DEFAULT_PORTRAIT_DARK,
  DEFAULT_PORTRAIT_LIGHT,
} from "@/lib/therapists/default-portrait";

type Props = {
  slug: string;
  portraitSrc: string;
  defaultPortrait?: boolean;
  className?: string;
  sizes?: string;
  priority?: boolean;
  editClipBounds?: boolean;
};

export function TherapistPortraitMedia({
  slug,
  portraitSrc,
  defaultPortrait,
  className = "object-cover object-top",
  sizes,
  priority,
  editClipBounds,
}: Props) {
  const portraitKey = `therapists.${slug}.portrait`;
  const edit = useEditDraftOptional();
  const pendingDelete = Boolean(edit?.isImagePendingDelete(portraitKey));
  const useDefaults = defaultPortrait === true || pendingDelete;

  const lightPreview = useEditImageSrc(
    portraitKey,
    useDefaults ? DEFAULT_PORTRAIT_LIGHT : portraitSrc,
  );
  const darkPreview = useEditImageSrc(
    portraitKey,
    useDefaults ? DEFAULT_PORTRAIT_DARK : portraitSrc,
  );
  const showThemedDefaults =
    useDefaults && (pendingDelete || lightPreview === DEFAULT_PORTRAIT_LIGHT);

  if (showThemedDefaults) {
    return (
      <>
        <Image
          src={lightPreview}
          alt=""
          fill
          className={`${className} dark:hidden`}
          sizes={sizes}
          priority={priority}
          draggable={false}
        />
        <Image
          src={darkPreview}
          alt=""
          fill
          className={`${className} hidden dark:block`}
          sizes={sizes}
          priority={priority}
          draggable={false}
        />
      </>
    );
  }

  return (
    <EditableImage
      editKey={portraitKey}
      src={portraitSrc}
      alt=""
      fill
      className={className}
      sizes={sizes}
      priority={priority}
      editClipBounds={editClipBounds}
    />
  );
}
