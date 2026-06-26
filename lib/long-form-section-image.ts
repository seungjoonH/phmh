// 롱폼 동적 섹션(sec_*) 헤더 이미지 public 경로 해석
import { getImageRegistryEntry } from "@/lib/edit/image-registry";
import { isImageKeyHidden } from "@/lib/image-hidden";

export function resolveLongFormSectionImageSrc(
  imageDomain: "therapy" | "area",
  slug: string,
  staticImages: Record<string, string>,
): string | undefined {
  const imageKey = `${imageDomain}.${slug}`;
  if (isImageKeyHidden(imageKey)) return undefined;
  if (slug in staticImages) return staticImages[slug];
  if (!slug.startsWith("sec_")) return undefined;
  return getImageRegistryEntry(imageKey)?.publicPath;
}
