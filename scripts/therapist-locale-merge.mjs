// 상담사 locale 파일 병합·분리 (edit-server·마이그레이션)
/**
 * @param {Partial<Record<string, import('../lib/therapists/merge-record').TherapistLocaleSlice>>} slices
 * @param {readonly string[]} contentLocales
 * @param {string} id
 * @param {string} locale
 */
function blockForLocale(slices, contentLocales, id, locale) {
  for (const loc of contentLocales) {
    const block = slices[loc]?.profile?.blocks?.find((b) => b.id === id);
    if (block) return block;
  }
  return slices[locale]?.profile?.blocks?.find((b) => b.id === id);
}

/**
 * @param {Partial<Record<string, { profile: { blocks: unknown[] } }>>} slices
 * @param {readonly string[]} contentLocales
 */
function blocksTemplate(slices, contentLocales) {
  for (const loc of contentLocales) {
    const blocks = slices[loc]?.profile?.blocks;
    if (blocks?.length) return blocks;
  }
  return [];
}

/**
 * @param {Partial<Record<string, { profile: { blocks: unknown[] } }>>} slices
 * @param {readonly string[]} contentLocales
 */
function mergeBlocks(slices, contentLocales) {
  const template = blocksTemplate(slices, contentLocales);

  return template.map((ref) => {
    if (ref.type === "heading") {
      const text = Object.fromEntries(
        contentLocales.map((loc) => {
          const b = blockForLocale(slices, contentLocales, ref.id, loc);
          return [loc, b?.type === "heading" ? b.text : ""];
        }),
      );
      return { id: ref.id, type: "heading", level: ref.level, text };
    }
    if (ref.type === "paragraph") {
      const text = Object.fromEntries(
        contentLocales.map((loc) => {
          const b = blockForLocale(slices, contentLocales, ref.id, loc);
          return [loc, b?.type === "paragraph" ? b.text : ""];
        }),
      );
      return { id: ref.id, type: "paragraph", text };
    }
    const items = Object.fromEntries(
      contentLocales.map((loc) => {
        const b = blockForLocale(slices, contentLocales, ref.id, loc);
        return [loc, b?.type === "list" ? b.items : []];
      }),
    );
    return { id: ref.id, type: "list", items };
  });
}

/**
 * @param {{ slug: string; portrait: string }} meta
 * @param {Partial<Record<string, { list: object; profile: { header: object; blocks: unknown[] } }>>} slices
 * @param {readonly string[]} contentLocales
 */
export function mergeTherapistRecord(meta, slices, contentLocales) {
  const pick = (loc) => slices[loc];

  return {
    slug: meta.slug,
    list: {
      name: Object.fromEntries(
        contentLocales.map((loc) => [loc, pick(loc)?.list?.name ?? ""]),
      ),
      subtitle: Object.fromEntries(
        contentLocales.map((loc) => [loc, pick(loc)?.list?.subtitle ?? ""]),
      ),
      bullets: Object.fromEntries(
        contentLocales.map((loc) => [loc, pick(loc)?.list?.bullets ?? []]),
      ),
      ctaLabel: Object.fromEntries(
        contentLocales.map((loc) => [loc, pick(loc)?.list?.ctaLabel ?? ""]),
      ),
    },
    profile: {
      header: {
        name: Object.fromEntries(
          contentLocales.map((loc) => [
            loc,
            pick(loc)?.profile?.header?.name ?? "",
          ]),
        ),
        lines: Object.fromEntries(
          contentLocales.map((loc) => [
            loc,
            pick(loc)?.profile?.header?.lines ?? [],
          ]),
        ),
      },
      portrait: meta.portrait,
      blocks: mergeBlocks(slices, contentLocales),
    },
  };
}

/**
 * @param {import('../lib/therapists/types').TherapistRecord} record
 * @param {string} locale
 * @param {readonly string[]} contentLocales
 */
export function extractTherapistLocaleSlice(record, locale, contentLocales) {
  const primary = contentLocales[0] ?? "en";
  const pickText = (map) => map[locale] ?? map[primary] ?? "";
  const pickArr = (map) => map[locale] ?? map[primary] ?? [];

  const blocks = (record.profile?.blocks ?? []).map((block) => {
    if (block.type === "heading") {
      return {
        id: block.id,
        type: "heading",
        level: block.level,
        text: pickText(block.text),
      };
    }
    if (block.type === "paragraph") {
      return {
        id: block.id,
        type: "paragraph",
        text: pickText(block.text),
      };
    }
    return {
      id: block.id,
      type: "list",
      items: pickArr(block.items),
    };
  });

  return {
    list: {
      name: pickText(record.list.name),
      subtitle: pickText(record.list.subtitle),
      bullets: pickArr(record.list.bullets),
      ctaLabel: pickText(record.list.ctaLabel),
    },
    profile: {
      header: {
        name: pickText(record.profile.header.name),
        lines: pickArr(record.profile.header.lines),
      },
      blocks,
    },
  };
}
