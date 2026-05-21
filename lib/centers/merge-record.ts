// Center locale 파일을 CenterRecord로 병합
import type { ContentBlock, ContentLocale } from "@/lib/content-blocks/types";
import { getCenterContentLocaleIds } from "@/lib/centers/manifest";
import type { CenterGalleryImage, CenterRecord } from "@/lib/centers/types";

export type CenterLocaleBlock =
  | { id: string; type: "heading"; level: 1 | 2 | 3 | 4 | 5 | 6; text: string }
  | { id: string; type: "paragraph"; text: string }
  | { id: string; type: "list"; ordered?: boolean; items: string[] };

export type CenterLocaleSlice = {
  nav: { label: string };
  page: {
    eyebrow: string;
    title: string;
    summary: string;
  };
  parking: string;
  extraInfo: string[];
  blocks: CenterLocaleBlock[];
  imageAlt: {
    hero: string;
    gallery: Record<string, string>;
  };
};

export type CenterMeta = {
  slug: string;
  contactRef: string;
  mapRef: string;
  hero: string;
  defaultHero?: boolean;
  gallery: CenterGalleryImage[];
};

function blockForLocale(
  slices: Partial<Record<ContentLocale, CenterLocaleSlice>>,
  contentLocales: readonly string[],
  id: string,
  locale: ContentLocale,
): CenterLocaleBlock | undefined {
  for (const loc of contentLocales) {
    const block = slices[loc as ContentLocale]?.blocks.find((b) => b.id === id);
    if (block) return block;
  }
  return slices[locale]?.blocks.find((b) => b.id === id);
}

function blocksTemplate(
  slices: Partial<Record<ContentLocale, CenterLocaleSlice>>,
  contentLocales: readonly string[],
): CenterLocaleBlock[] {
  for (const loc of contentLocales) {
    const blocks = slices[loc as ContentLocale]?.blocks;
    if (blocks?.length) return blocks;
  }
  return [];
}

function mergeBlocks(
  slices: Partial<Record<ContentLocale, CenterLocaleSlice>>,
  contentLocales: readonly string[],
): ContentBlock[] {
  const template = blocksTemplate(slices, contentLocales);

  return template.map((ref) => {
    if (ref.type === "heading") {
      return {
        id: ref.id,
        type: "heading",
        level: ref.level,
        text: Object.fromEntries(
          contentLocales.map((loc) => {
            const b = blockForLocale(slices, contentLocales, ref.id, loc as ContentLocale);
            return [loc, b?.type === "heading" ? b.text : ""];
          }),
        ),
      } as ContentBlock;
    }
    if (ref.type === "paragraph") {
      return {
        id: ref.id,
        type: "paragraph",
        text: Object.fromEntries(
          contentLocales.map((loc) => {
            const b = blockForLocale(slices, contentLocales, ref.id, loc as ContentLocale);
            return [loc, b?.type === "paragraph" ? b.text : ""];
          }),
        ),
      } as ContentBlock;
    }
    return {
      id: ref.id,
      type: "list",
      ordered: ref.ordered ?? false,
      items: Object.fromEntries(
        contentLocales.map((loc) => {
          const b = blockForLocale(slices, contentLocales, ref.id, loc as ContentLocale);
          return [loc, b?.type === "list" ? b.items : []];
        }),
      ),
    } as ContentBlock;
  });
}

export function mergeCenterRecord(
  meta: CenterMeta,
  slices: Partial<Record<ContentLocale, CenterLocaleSlice>>,
  contentLocales: readonly string[] = getCenterContentLocaleIds(),
): CenterRecord {
  const pick = (loc: ContentLocale) => slices[loc];
  const mapString = (fn: (slice: CenterLocaleSlice | undefined) => string) =>
    Object.fromEntries(
      contentLocales.map((loc) => [loc, fn(pick(loc as ContentLocale)) ?? ""]),
    ) as Record<ContentLocale, string>;

  return {
    slug: meta.slug,
    contactRef: meta.contactRef,
    mapRef: meta.mapRef,
    hero: meta.hero,
    ...(meta.defaultHero ? { defaultHero: true } : {}),
    gallery: meta.gallery ?? [],
    nav: {
      label: mapString((slice) => slice?.nav.label ?? ""),
    },
    page: {
      eyebrow: mapString((slice) => slice?.page.eyebrow ?? ""),
      title: mapString((slice) => slice?.page.title ?? ""),
      summary: mapString((slice) => slice?.page.summary ?? ""),
    },
    parking: mapString((slice) => slice?.parking ?? ""),
    extraInfo: Object.fromEntries(
      contentLocales.map((loc) => [loc, pick(loc as ContentLocale)?.extraInfo ?? []]),
    ) as Record<ContentLocale, string[]>,
    blocks: mergeBlocks(slices, contentLocales),
    imageAlt: {
      hero: mapString((slice) => slice?.imageAlt.hero ?? ""),
      gallery: Object.fromEntries(
        contentLocales.map((loc) => [
          loc,
          pick(loc as ContentLocale)?.imageAlt.gallery ?? {},
        ]),
      ) as Record<ContentLocale, Record<string, string>>,
    },
  };
}
