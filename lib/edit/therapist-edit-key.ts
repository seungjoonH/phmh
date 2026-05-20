// 상담사 data/*.js 필드 — dot-path 편집 키
import type { ContentLocale } from "@/lib/content-blocks/types";
import type { LocaleTextValues } from "@/lib/edit/client";
import { getTherapistContentLocaleIds } from "@/lib/therapists/manifest";
import type { TherapistRecord } from "@/lib/therapists/types";

const PREFIX = "therapists.";

export type TherapistScalarField =
  | "list.name"
  | "list.subtitle"
  | "list.ctaLabel"
  | "profile.header.name";

export type TherapistArrayField = "list.bullets" | "profile.header.lines";

export type TherapistBlockTextField = {
  kind: "block-text";
  slug: string;
  blockId: string;
};

export type TherapistBlockListItemField = {
  kind: "block-list-item";
  slug: string;
  blockId: string;
  index: number;
};

export type TherapistScalarRef = {
  kind: "scalar";
  slug: string;
  field: TherapistScalarField;
};

export type TherapistArrayItemRef = {
  kind: "array-item";
  slug: string;
  field: TherapistArrayField;
  index: number;
};

export type TherapistFieldRef =
  | TherapistScalarRef
  | TherapistArrayItemRef
  | TherapistBlockTextField
  | TherapistBlockListItemField;

export function therapistListKey(
  slug: string,
  field: "name" | "subtitle" | "ctaLabel",
): string {
  return `${PREFIX}${slug}.list.${field}`;
}

export function therapistListBulletKey(slug: string, index: number): string {
  return `${PREFIX}${slug}.list.bullets.${index}`;
}

export function therapistHeaderNameKey(slug: string): string {
  return `${PREFIX}${slug}.profile.header.name`;
}

export function therapistHeaderLineKey(slug: string, index: number): string {
  return `${PREFIX}${slug}.profile.header.lines.${index}`;
}

export function therapistBlockTextKey(slug: string, blockId: string): string {
  return `${PREFIX}${slug}.blocks.${blockId}.text`;
}

export function therapistBlockListItemKey(
  slug: string,
  blockId: string,
  index: number,
): string {
  return `${PREFIX}${slug}.blocks.${blockId}.items.${index}`;
}

export function isTherapistEditKey(key: string): boolean {
  return key.startsWith(PREFIX);
}

export function parseTherapistFieldKey(key: string): TherapistFieldRef | null {
  if (!key.startsWith(PREFIX)) return null;
  const rest = key.slice(PREFIX.length);
  const parts = rest.split(".");

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

  const bullet = /^(.+)\.list\.bullets\.(\d+)$/.exec(rest);
  if (bullet) {
    return {
      kind: "array-item",
      slug: bullet[1],
      field: "list.bullets",
      index: Number(bullet[2]),
    };
  }

  const line = /^(.+)\.profile\.header\.lines\.(\d+)$/.exec(rest);
  if (line) {
    return {
      kind: "array-item",
      slug: line[1],
      field: "profile.header.lines",
      index: Number(line[2]),
    };
  }

  if (parts.length === 3 && parts[1] === "list") {
    const field = parts[2];
    if (field === "name" || field === "subtitle" || field === "ctaLabel") {
      return { kind: "scalar", slug: parts[0], field: `list.${field}` as TherapistScalarField };
    }
  }

  if (rest.endsWith(".profile.header.name")) {
    const slug = rest.slice(0, -".profile.header.name".length);
    if (slug) return { kind: "scalar", slug, field: "profile.header.name" };
  }

  return null;
}

function therapistContentLocales(): readonly ContentLocale[] {
  return getTherapistContentLocaleIds() as ContentLocale[];
}

function emptyLocaleTextValues(): LocaleTextValues {
  return Object.fromEntries(
    therapistContentLocales().map((id) => [id, ""]),
  ) as LocaleTextValues;
}

function localeMapToTextValues(
  map: Record<ContentLocale, string>,
): LocaleTextValues {
  return Object.fromEntries(
    therapistContentLocales().map((id) => [id, map[id] ?? ""]),
  ) as LocaleTextValues;
}

function localeMapArrayItemToTextValues(
  map: Record<ContentLocale, string[]>,
  index: number,
): LocaleTextValues {
  return Object.fromEntries(
    therapistContentLocales().map((id) => [id, map[id]?.[index] ?? ""]),
  ) as LocaleTextValues;
}

export function readTherapistFieldLocales(
  record: TherapistRecord,
  ref: TherapistFieldRef,
): LocaleTextValues {
  switch (ref.kind) {
    case "scalar": {
      if (ref.field === "list.name") return localeMapToTextValues(record.list.name);
      if (ref.field === "list.subtitle") return localeMapToTextValues(record.list.subtitle);
      if (ref.field === "list.ctaLabel") return localeMapToTextValues(record.list.ctaLabel);
      return localeMapToTextValues(record.profile.header.name);
    }
    case "array-item": {
      if (ref.field === "list.bullets") {
        return localeMapArrayItemToTextValues(record.list.bullets, ref.index);
      }
      return localeMapArrayItemToTextValues(record.profile.header.lines, ref.index);
    }
    case "block-text": {
      const block = record.profile.blocks.find((b) => b.id === ref.blockId);
      if (!block || (block.type !== "heading" && block.type !== "paragraph")) {
        return emptyLocaleTextValues();
      }
      return localeMapToTextValues(block.text);
    }
    case "block-list-item": {
      const block = record.profile.blocks.find((b) => b.id === ref.blockId);
      if (!block || block.type !== "list") return emptyLocaleTextValues();
      return localeMapArrayItemToTextValues(block.items, ref.index);
    }
    default:
      return emptyLocaleTextValues();
  }
}

export function applyTherapistFieldLocales(
  record: TherapistRecord,
  ref: TherapistFieldRef,
  entry: LocaleTextValues,
): TherapistRecord {
  const next = structuredClone(record) as TherapistRecord;

  const applyMap = (target: Record<ContentLocale, string>) => {
    for (const id of therapistContentLocales()) {
      if (entry[id] !== undefined) target[id] = entry[id] ?? "";
    }
  };

  const applyArrayItem = (target: Record<ContentLocale, string[]>, index: number) => {
    for (const id of therapistContentLocales()) {
      const arr = [...(target[id] ?? [])];
      while (arr.length <= index) arr.push("");
      arr[index] = entry[id] ?? arr[index] ?? "";
      target[id] = arr;
    }
  };

  switch (ref.kind) {
    case "scalar":
      if (ref.field === "list.name") applyMap(next.list.name);
      else if (ref.field === "list.subtitle") applyMap(next.list.subtitle);
      else if (ref.field === "list.ctaLabel") applyMap(next.list.ctaLabel);
      else applyMap(next.profile.header.name);
      break;
    case "array-item":
      if (ref.field === "list.bullets") applyArrayItem(next.list.bullets, ref.index);
      else applyArrayItem(next.profile.header.lines, ref.index);
      break;
    case "block-text": {
      const block = next.profile.blocks.find((b) => b.id === ref.blockId);
      if (block && (block.type === "heading" || block.type === "paragraph")) {
        applyMap(block.text);
      }
      break;
    }
    case "block-list-item": {
      const block = next.profile.blocks.find((b) => b.id === ref.blockId);
      if (block?.type === "list") applyArrayItem(block.items, ref.index);
      break;
    }
  }

  return next;
}

/** nav·카드·프로필 H1 이름 동기화 */
export function getTherapistLinkedTextKeys(key: string): string[] | null {
  const ref = parseTherapistFieldKey(key);
  if (!ref || ref.kind !== "scalar") return null;
  if (ref.field === "list.name" || ref.field === "profile.header.name") {
    return [therapistListKey(ref.slug, "name"), therapistHeaderNameKey(ref.slug)];
  }
  return null;
}

export function applyTherapistNameLocales(
  record: TherapistRecord,
  entry: LocaleTextValues,
): TherapistRecord {
  let next = applyTherapistFieldLocales(record, {
    kind: "scalar",
    slug: record.slug,
    field: "list.name",
  }, entry);
  next = applyTherapistFieldLocales(next, {
    kind: "scalar",
    slug: record.slug,
    field: "profile.header.name",
  }, entry);
  return next;
}
