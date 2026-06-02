"use client";

// 페이지 상단 풀폭 히어로 배너 (패럴랙스). 이미지 미존재/숨김 시 light·dark default로 자동 전환.
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { EditableImage } from "@/components/edit/EditableImage";
import { useEditDraftOptional } from "@/components/edit/EditDraftProvider";
import { DEFAULT_HERO_DARK, DEFAULT_HERO_LIGHT } from "@/lib/default-hero";
import { editImageAttrs } from "@/lib/edit/attrs";
import { isEditMode } from "@/lib/edit/env";
import { isImageKeyHidden } from "@/lib/image-hidden";

type Props = {
  src: string;
  fallbackSrc?: string;
  alt?: string;
  priority?: boolean;
  useDefault?: boolean;
  /** 편집 모드 이미지 키 (예: heroes.contact) */
  editKey?: string;
};

export function PageHeroBanner({
  src,
  fallbackSrc,
  alt = "",
  priority = false,
  useDefault: forceDefault = false,
  editKey,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const imageY = useTransform(scrollYProgress, [0, 1], ["-6%", "32%"]);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1.08, 1.14]);

  const editActive = Boolean(editKey && isEditMode());
  const editAttrs = editActive && editKey ? editImageAttrs(editKey) : undefined;
  const edit = useEditDraftOptional();

  const explicitlyHidden = editKey ? isImageKeyHidden(editKey) : false;
  const pendingImageDraft = Boolean(editKey && edit?.imageDrafts[editKey]);
  const pendingDelete = Boolean(editKey && edit?.isImagePendingDelete(editKey));
  const [imageFailed, setImageFailed] = useState(false);
  const [fallbackTried, setFallbackTried] = useState(false);
  // src가 바뀌면 실패 상태 초기화 (편집 모드 미리보기 대비)
  useEffect(() => {
    setImageFailed(false);
    setFallbackTried(false);
  }, [src, fallbackSrc]);
  const activeSrc = !fallbackTried ? src : fallbackSrc ?? src;
  const useDefault =
    !pendingImageDraft &&
    (forceDefault || explicitlyHidden || pendingDelete || imageFailed);

  return (
    <div
      ref={ref}
      className="relative min-h-[52vh] w-full overflow-hidden md:min-h-[64vh]"
      aria-hidden={alt === "" ? true : undefined}
      {...editAttrs}
    >
      <motion.div
        className="absolute inset-0 -top-[6%] h-[112%] overflow-hidden will-change-transform md:-top-[8%] md:h-[116%]"
        style={
          reduce
            ? undefined
            : { y: imageY, scale: imageScale, willChange: "transform" }
        }
      >
        {useDefault ? (
          <>
            <Image
              src={DEFAULT_HERO_LIGHT}
              alt={alt}
              fill
              className="object-cover object-top dark:hidden"
              priority={priority}
              sizes="100vw"
              draggable={false}
            />
            <Image
              src={DEFAULT_HERO_DARK}
              alt={alt}
              fill
              className="hidden object-cover object-top dark:block"
              priority={priority}
              sizes="100vw"
              draggable={false}
            />
          </>
        ) : (
          <EditableImage
            editKey={editKey}
            editClipBounds={editActive}
            src={activeSrc}
            alt={alt}
            fill
            className="object-cover object-top"
            priority={priority}
            sizes="100vw"
            onError={() => {
              if (!fallbackTried && fallbackSrc) {
                setFallbackTried(true);
                return;
              }
              setImageFailed(true);
            }}
          />
        )}
      </motion.div>
      <motion.div className="hero-banner-fade" aria-hidden />
    </div>
  );
}
