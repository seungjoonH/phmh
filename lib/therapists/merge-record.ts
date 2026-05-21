// 상담사 locale 파일 → TherapistRecord 병합
import type { ContentBlock, ContentLocale } from "@/lib/content-blocks/types";
import { getTherapistContentLocaleIds } from "@/lib/therapists/manifest";
import type { TherapistRecord } from "@/lib/therapists/types";

/** locale 단일 파일에 저장하는 블록 (text·items는 문자열) */
export type TherapistLocaleBlock =
  | { id: string; type: "heading"; level: 1 | 2 | 3 | 4 | 5 | 6; text: string }
  | { id: string; type: "paragraph"; text: string }
  | { id: string; type: "list"; ordered?: boolean; items: string[] };

export type TherapistLocaleSlice = {
  list: {
    name: string;
    subtitle: string;
    bullets: string[];
    ctaLabel: string;
  };
  profile: {
    header: {
      name: string;
      lines: string[];
    };
    blocks: TherapistLocaleBlock[];
  };
};

export type TherapistMeta = {
  slug: string;
  portrait: string;
  defaultPortrait?: boolean;
};

function primaryContentLocale(): ContentLocale {
  return getTherapistContentLocaleIds()[0] ?? "en";
}

function pickLocaleText(
  map: Record<ContentLocale, string>,
  locale: ContentLocale,
): string {
  const primary = primaryContentLocale();
  return map[locale] ?? map[primary] ?? "";
}

function pickLocaleArray(
  map: Record<ContentLocale, string[]>,
  locale: ContentLocale,
): string[] {
  const primary = primaryContentLocale();
  return map[locale] ?? map[primary] ?? [];
}

function blockForLocale(
  slices: Partial<Record<ContentLocale, TherapistLocaleSlice>>,
  contentLocales: readonly string[],
  id: string,
  locale: ContentLocale,
): TherapistLocaleBlock | undefined {
  for (const loc of contentLocales) {
    const block = slices[loc as ContentLocale]?.profile.blocks.find((b) => b.id === id);
    if (block) return block;
  }
  return slices[locale]?.profile.blocks.find((b) => b.id === id);
}

function blocksTemplate(
  slices: Partial<Record<ContentLocale, TherapistLocaleSlice>>,
  contentLocales: readonly string[],
): TherapistLocaleBlock[] {
  for (const loc of contentLocales) {
    const blocks = slices[loc as ContentLocale]?.profile.blocks;
    if (blocks?.length) return blocks;
  }
  return [];
}

function mergeBlocks(
  slices: Partial<Record<ContentLocale, TherapistLocaleSlice>>,
  contentLocales: readonly string[],
): ContentBlock[] {
  const template = blocksTemplate(slices, contentLocales);

  return template.map((ref) => {
    if (ref.type === "heading") {
      const text = Object.fromEntries(
        contentLocales.map((loc) => {
          const b = blockForLocale(slices, contentLocales, ref.id, loc as ContentLocale);
          return [loc, b?.type === "heading" ? b.text : ""];
        }),
      ) as Record<ContentLocale, string>;
      return { id: ref.id, type: "heading", level: ref.level, text };
    }
    if (ref.type === "paragraph") {
      const text = Object.fromEntries(
        contentLocales.map((loc) => {
          const b = blockForLocale(slices, contentLocales, ref.id, loc as ContentLocale);
          return [loc, b?.type === "paragraph" ? b.text : ""];
        }),
      ) as Record<ContentLocale, string>;
      return { id: ref.id, type: "paragraph", text };
    }
    const items = Object.fromEntries(
      contentLocales.map((loc) => {
        const b = blockForLocale(slices, contentLocales, ref.id, loc as ContentLocale);
        return [loc, b?.type === "list" ? b.items : []];
      }),
    ) as Record<ContentLocale, string[]>;
    return { id: ref.id, type: "list", ordered: ref.ordered ?? false, items };
  });
}

export function mergeTherapistRecord(
  meta: TherapistMeta,
  slices: Partial<Record<ContentLocale, TherapistLocaleSlice>>,
  contentLocales: readonly string[] = getTherapistContentLocaleIds(),
): TherapistRecord {
  const pick = (loc: ContentLocale) => slices[loc];
  return {
    slug: meta.slug,
    list: {
      name: Object.fromEntries(
        contentLocales.map((loc) => [loc, pick(loc as ContentLocale)?.list.name ?? ""]),
      ) as Record<ContentLocale, string>,
      subtitle: Object.fromEntries(
        contentLocales.map((loc) => [loc, pick(loc as ContentLocale)?.list.subtitle ?? ""]),
      ) as Record<ContentLocale, string>,
      bullets: Object.fromEntries(
        contentLocales.map((loc) => [loc, pick(loc as ContentLocale)?.list.bullets ?? []]),
      ) as Record<ContentLocale, string[]>,
      ctaLabel: Object.fromEntries(
        contentLocales.map((loc) => [loc, pick(loc as ContentLocale)?.list.ctaLabel ?? ""]),
      ) as Record<ContentLocale, string>,
    },
    profile: {
      header: {
        name: Object.fromEntries(
          contentLocales.map((loc) => [
            loc,
            pick(loc as ContentLocale)?.profile.header.name ?? "",
          ]),
        ) as Record<ContentLocale, string>,
        lines: Object.fromEntries(
          contentLocales.map((loc) => [
            loc,
            pick(loc as ContentLocale)?.profile.header.lines ?? [],
          ]),
        ) as Record<ContentLocale, string[]>,
      },
      portrait: meta.portrait,
      ...(meta.defaultPortrait ? { defaultPortrait: true } : {}),
      blocks: mergeBlocks(slices, contentLocales),
    },
  };
}

export function extractTherapistLocaleSlice(
  record: TherapistRecord,
  locale: ContentLocale,
): TherapistLocaleSlice {
  const blocks: TherapistLocaleBlock[] = record.profile.blocks.map((block) => {
    if (block.type === "heading") {
      return {
        id: block.id,
        type: "heading",
        level: block.level,
        text: pickLocaleText(block.text, locale),
      };
    }
    if (block.type === "paragraph") {
      return {
        id: block.id,
        type: "paragraph",
        text: pickLocaleText(block.text, locale),
      };
    }
    return {
      id: block.id,
      type: "list",
      ...(block.ordered ? { ordered: true } : {}),
      items: pickLocaleArray(block.items, locale),
    };
  });

  return {
    list: {
      name: pickLocaleText(record.list.name, locale),
      subtitle: pickLocaleText(record.list.subtitle, locale),
      bullets: pickLocaleArray(record.list.bullets, locale),
      ctaLabel: pickLocaleText(record.list.ctaLabel, locale),
    },
    profile: {
      header: {
        name: pickLocaleText(record.profile.header.name, locale),
        lines: pickLocaleArray(record.profile.header.lines, locale),
      },
      blocks,
    },
  };
}
