// Center data/*.js 필드 편집 키와 locale 값 병합
import type { ContentLocale } from "@/lib/content-blocks/types";
import type { LocaleTextValues } from "@/lib/edit/client";
import { getCenterContentLocaleIds } from "@/lib/centers/manifest";
import type { CenterRecord } from "@/lib/centers/types";

const PREFIX = "centers.";

export type CenterScalarField =
  | "nav.label"
  | "page.title"
  | "page.summary"
  | "page.eyebrow"
  | "parking";

export type CenterScalarRef = {
  kind: "scalar";
  slug: string;
  field: CenterScalarField;
};

export type CenterBlockTextRef = {
  kind: "block-text";
  slug: string;
  blockId: string;
};

export type CenterBlockListItemRef = {
  kind: "block-list-item";
  slug: string;
  blockId: string;
  index: number;
};

export type CenterFieldRef =
  | CenterScalarRef
  | CenterBlockTextRef
  | CenterBlockListItemRef;

export function centerNavLabelKey(slug: string): string {
  return `${PREFIX}${slug}.nav.label`;
}

export function centerPageKey(
  slug: string,
  field: "title" | "summary" | "eyebrow",
): string {
  return `${PREFIX}${slug}.page.${field}`;
}

export function centerParkingKey(slug: string): string {
  return `${PREFIX}${slug}.parking`;
}

export function centerImagesEditKey(slug: string): string {
  return `${PREFIX}${slug}.images`;
}

export function centerDefaultImageKey(slug: string): string {
  return `${PREFIX}${slug}.defaultImage`;
}

export function parseCenterDefaultImageKey(key: string): string | null {
  if (!key.startsWith(PREFIX)) return null;
  const rest = key.slice(PREFIX.length);
  const match = /^(.+)\.defaultImage$/.exec(rest);
  return match?.[1] ?? null;
}

export function parseCenterImagesKey(key: string): string | null {
  if (!key.startsWith(PREFIX)) return null;
  const rest = key.slice(PREFIX.length);
  const match = /^(.+)\.images$/.exec(rest);
  return match?.[1] ?? null;
}

export function centerBlockTextKey(slug: string, blockId: string): string {
  return `${PREFIX}${slug}.blocks.${blockId}.text`;
}

export function centerBlockListItemKey(
  slug: string,
  blockId: string,
  index: number,
): string {
  return `${PREFIX}${slug}.blocks.${blockId}.items.${index}`;
}

export function isCenterEditKey(key: string): boolean {
  return key.startsWith(PREFIX);
}

export function parseCenterFieldKey(key: string): CenterFieldRef | null {
  if (!key.startsWith(PREFIX)) return null;
  const rest = key.slice(PREFIX.length);

  const navLabel = /^(.+)\.nav\.label$/.exec(rest);
  if (navLabel) return { kind: "scalar", slug: navLabel[1], field: "nav.label" };

  const pageField = /^(.+)\.page\.(title|summary|eyebrow)$/.exec(rest);
  if (pageField) {
    return {
      kind: "scalar",
      slug: pageField[1],
      field: `page.${pageField[2]}` as CenterScalarField,
    };
  }

  const parking = /^(.+)\.parking$/.exec(rest);
  if (parking) return { kind: "scalar", slug: parking[1], field: "parking" };

  const blockText = /^(.+)\.blocks\.([^.]+)\.text$/.exec(rest);
  if (blockText) {
    return { kind: "block-text", slug: blockText[1], blockId: blockText[2] };
  }

  const blockItem = /^(.+)\.blocks\.([^.]+)\.items\.(\d+)$/.exec(rest);
  if (blockItem) {
    return {
      kind: "block-list-item",
      slug: blockItem[1],
      blockId: blockItem[2],
      index: Number(blockItem[3]),
    };
  }

  return null;
}

function centerContentLocales(): readonly ContentLocale[] {
  return getCenterContentLocaleIds() as ContentLocale[];
}

function emptyLocaleTextValues(): LocaleTextValues {
  return Object.fromEntries(
    centerContentLocales().map((id) => [id, ""]),
  ) as LocaleTextValues;
}

function localeMapToTextValues(
  map: Record<ContentLocale, string>,
): LocaleTextValues {
  return Object.fromEntries(
    centerContentLocales().map((id) => [id, map[id] ?? ""]),
  ) as LocaleTextValues;
}

export function readCenterFieldLocales(
  record: CenterRecord,
  ref: CenterFieldRef,
): LocaleTextValues {
  if (ref.kind === "block-text") {
    const block = record.blocks.find((b) => b.id === ref.blockId);
    if (!block || (block.type !== "heading" && block.type !== "paragraph")) {
      return emptyLocaleTextValues();
    }
    return localeMapToTextValues(block.text);
  }
  if (ref.kind === "block-list-item") {
    const block = record.blocks.find((b) => b.id === ref.blockId);
    if (!block || block.type !== "list") return emptyLocaleTextValues();
    return Object.fromEntries(
      centerContentLocales().map((id) => [id, block.items[id]?.[ref.index] ?? ""]),
    ) as LocaleTextValues;
  }
  if (ref.field === "nav.label") return localeMapToTextValues(record.nav.label);
  if (ref.field === "page.title") return localeMapToTextValues(record.page.title);
  if (ref.field === "page.summary") return localeMapToTextValues(record.page.summary);
  if (ref.field === "page.eyebrow") return localeMapToTextValues(record.page.eyebrow);
  if (ref.field === "parking") return localeMapToTextValues(record.parking);
  return emptyLocaleTextValues();
}

export function applyCenterFieldLocales(
  record: CenterRecord,
  ref: CenterFieldRef,
  entry: LocaleTextValues,
): CenterRecord {
  const next = structuredClone(record) as CenterRecord;
  const applyMap = (target: Record<ContentLocale, string>) => {
    for (const id of centerContentLocales()) {
      if (entry[id] !== undefined) target[id] = entry[id] ?? "";
    }
  };

  if (ref.kind === "block-text") {
    const block = next.blocks.find((b) => b.id === ref.blockId);
    if (block && (block.type === "heading" || block.type === "paragraph")) {
      applyMap(block.text);
    }
    return next;
  }

  if (ref.kind === "block-list-item") {
    const block = next.blocks.find((b) => b.id === ref.blockId);
    if (block?.type === "list") {
      for (const id of centerContentLocales()) {
        const arr = [...(block.items[id] ?? [])];
        while (arr.length <= ref.index) arr.push("");
        arr[ref.index] = entry[id] ?? arr[ref.index] ?? "";
        block.items[id] = arr;
      }
    }
    return next;
  }

  if (ref.field === "nav.label") applyMap(next.nav.label);
  else if (ref.field === "page.title") applyMap(next.page.title);
  else if (ref.field === "page.summary") applyMap(next.page.summary);
  else if (ref.field === "page.eyebrow") applyMap(next.page.eyebrow);
  else if (ref.field === "parking") applyMap(next.parking);

  return next;
}

export function getCenterLinkedTextKeys(key: string): string[] | null {
  const ref = parseCenterFieldKey(key);
  if (!ref || ref.kind !== "scalar") return null;
  if (ref.field === "nav.label" || ref.field === "page.title") {
    return [centerNavLabelKey(ref.slug), centerPageKey(ref.slug, "title")];
  }
  return null;
}

export function applyCenterTitleLocales(
  record: CenterRecord,
  entry: LocaleTextValues,
): CenterRecord {
  let next = applyCenterFieldLocales(
    record,
    { kind: "scalar", slug: record.slug, field: "nav.label" },
    entry,
  );
  next = applyCenterFieldLocales(
    next,
    { kind: "scalar", slug: record.slug, field: "page.title" },
    entry,
  );
  return next;
}
