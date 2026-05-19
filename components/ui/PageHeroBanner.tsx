"use client";

// 페이지 상단 풀폭 히어로 배너 (패럴랙스)
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { EditableImage } from "@/components/edit/EditableImage";
import { editImageAttrs } from "@/lib/edit/attrs";
import { isEditMode } from "@/lib/edit/env";

type Props = {
  src: string;
  alt?: string;
  priority?: boolean;
  /** 편집 모드 이미지 키 (예: heroes.contact) */
  editKey?: string;
};

export function PageHeroBanner({ src, alt = "", priority = false, editKey }: Props) {
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
        <EditableImage
          editKey={editKey}
          editClipBounds={editActive}
          src={src}
          alt={alt}
          fill
          className="object-cover object-top"
          priority={priority}
          sizes="100vw"
        />
      </motion.div>
      <motion.div className="hero-banner-fade" aria-hidden />
    </div>
  );
}
