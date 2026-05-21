"use client";

// Center 대표 이미지를 기본 landscape 이미지와 업로드 이미지로 표시
import Image from "next/image";
import { DEFAULT_HERO_LIGHT } from "@/lib/default-hero";

type Props = {
  src: string;
  alt: string;
  defaultHero?: boolean;
  className?: string;
};

export function CenterHeroMedia({ src, alt, defaultHero, className }: Props) {
  return (
    <Image
      src={defaultHero ? DEFAULT_HERO_LIGHT : src}
      alt={alt}
      width={1200}
      height={750}
      className={className}
      loading="lazy"
    />
  );
}
