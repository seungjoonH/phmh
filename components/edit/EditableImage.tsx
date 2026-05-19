"use client";

// 편집 모드 이미지 — 클릭 시 교체 패널
import Image, { type ImageProps } from "next/image";
import { useEditImageSrc } from "@/components/edit/useEditImageSrc";
import { editImageAttrs } from "@/lib/edit/attrs";
import { isEditMode } from "@/lib/edit/env";

type Props = Omit<ImageProps, "src"> & {
  editKey?: string;
  src: string;
  /** true면 data-phmh-edit은 부모(클립 박스)에 두고 이미지 크기는 그대로 */
  editClipBounds?: boolean;
};

export function EditableImage({
  editKey,
  src,
  alt = "",
  className,
  fill,
  editClipBounds = false,
  ...rest
}: Props) {
  const resolvedFromEdit = useEditImageSrc(editKey ?? "", src);
  const resolvedSrc = editKey ? resolvedFromEdit : src;

  if (!editKey || !isEditMode()) {
    return (
      <Image src={resolvedSrc} alt={alt} className={className} fill={fill} {...rest} />
    );
  }

  // fill(히어로·섹션 배너)만 컨테이너를 채움 — 로고 등 고정 비율 이미지는 h-full 금지
  const wrapperClass = fill
    ? "absolute inset-0"
    : "relative inline-block w-fit max-w-full";

  const editOnParent = editClipBounds && fill;

  return (
    <span className={wrapperClass} {...(editOnParent ? {} : editImageAttrs(editKey))}>
      <Image
        src={resolvedSrc}
        alt={alt}
        className={className}
        fill={fill}
        draggable={false}
        {...rest}
      />
    </span>
  );
}
