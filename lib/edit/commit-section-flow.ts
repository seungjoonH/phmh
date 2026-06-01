// flow 블록 순서 — locale 파일 groups/lists/closing·prose paragraphs에 반영
import {
  fetchLocaleCatalog,
  patchListBlocksArray,
  patchNestedStringArray,
  patchSectionFlow,
  patchStringArray,
  patchText,
  type LocaleTextValues,
} from "@/lib/edit/client";
import {
  isFlowScopedStorageKey,
  isNestedGroupCellKey,
} from "@/lib/edit/flow-group-key";
import {
  flowToProseSection,
  isLegacyParagraphTextKey,
  isProseStyleSectionKey,
  legacyParagraphTextsFromFlow,
  listBlocksForLocaleSave,
  remapLegacyParagraphTextKeys,
} from "@/lib/edit/prose-flow";
import { stripFlowBlockForStorage } from "@/lib/edit/section-flow";
import {
  flowToSectionContent,
  hydrateFlowBlocks,
  type FlowBlock,
} from "@/lib/edit/section-flow";
import { tPath } from "@/lib/i18n/messages";
import type { Messages } from "@/lib/i18n/messages";
import { getActiveLocaleIds } from "@/lib/site-locales";

async function messagesForLocale(locale: string): Promise<Messages> {
  const catalog = await fetchLocaleCatalog(locale);
  return catalog.messages as Messages;
}

function hydrateFlowForLocale(flow: FlowBlock[], messages: Messages): FlowBlock[] {
  return hydrateFlowBlocks(flow, (key) => tPath(messages, key));
}

async function sectionContentForLocale(
  sectionKey: string,
  flow: FlowBlock[],
  locale: string,
  prose: boolean,
) {
  const messages = await messagesForLocale(locale);
  const hydrated = hydrateFlowForLocale(flow, messages);
  return prose ? flowToProseSection(hydrated) : flowToSectionContent(hydrated);
}

async function patchSectionListsFromFlow(
  sectionKey: string,
  flow: FlowBlock[],
  prose: boolean,
): Promise<void> {
  const listLocales = Object.fromEntries(
    await Promise.all(
      getActiveLocaleIds().map(async (id) => {
        const section = await sectionContentForLocale(sectionKey, flow, id, prose);
        return [id, listBlocksForLocaleSave(section.lists)] as const;
      }),
    ),
  );
  await patchListBlocksArray(`${sectionKey}.lists`, listLocales);
}

async function commitServiceSectionFlow(
  sectionKey: string,
  flow: FlowBlock[],
): Promise<void> {
  const textKeys = new Set<string>();

  for (const block of flow) {
    if (
      block.type === "p" ||
      block.type === "heading" ||
      block.type === "sectionTitle" ||
      block.type === "button"
    ) {
      if (
        !isNestedGroupCellKey(block.textKey) &&
        !isFlowScopedStorageKey(sectionKey, block.textKey)
      ) {
        textKeys.add(block.textKey);
      }
    }
  }

  const groupLocales = Object.fromEntries(
    await Promise.all(
      getActiveLocaleIds().map(async (id) => {
        const section = await sectionContentForLocale(sectionKey, flow, id, false);
        return [id, section.groups ?? []] as const;
      }),
    ),
  );
  await patchNestedStringArray(`${sectionKey}.groups`, groupLocales);

  await patchSectionListsFromFlow(sectionKey, flow, false);

  const closingLocales = Object.fromEntries(
    await Promise.all(
      getActiveLocaleIds().map(async (id) => {
        const section = await sectionContentForLocale(sectionKey, flow, id, false);
        return [id, section.closing ?? []] as const;
      }),
    ),
  );
  await patchStringArray(`${sectionKey}.closing`, closingLocales);

  for (const key of textKeys) {
    const locales: LocaleTextValues = {};
    for (const id of getActiveLocaleIds()) {
      const messages = await messagesForLocale(id);
      const hydrated = hydrateFlowForLocale(flow, messages);
      const block = hydrated.find(
        (b) =>
          (b.type === "p" ||
            b.type === "heading" ||
            b.type === "sectionTitle" ||
            b.type === "button") &&
          b.textKey === key,
      );
      locales[id] =
        block?.type === "p" ||
        block?.type === "heading" ||
        block?.type === "sectionTitle" ||
        block?.type === "button"
          ? block.text
          : "";
    }
    await patchText(key, locales);
  }

  await patchSectionFlow(
    sectionKey,
    flow.map((b) => stripFlowBlockForStorage(b)),
  );
}

async function commitProseSectionFlow(
  sectionKey: string,
  flow: FlowBlock[],
): Promise<void> {
  const textKeys = new Set<string>();

  for (const block of flow) {
    if (
      block.type === "p" ||
      block.type === "heading" ||
      block.type === "sectionTitle" ||
      block.type === "button"
    ) {
      if (
        !isNestedGroupCellKey(block.textKey) &&
        !isFlowScopedStorageKey(sectionKey, block.textKey) &&
        !(
          block.type === "p" &&
          isLegacyParagraphTextKey(sectionKey, block.textKey)
        )
      ) {
        textKeys.add(block.textKey);
      }
    }
  }

  const paragraphLocales = Object.fromEntries(
    await Promise.all(
      getActiveLocaleIds().map(async (id) => {
        const messages = await messagesForLocale(id);
        const hydrated = hydrateFlowForLocale(flow, messages);
        return [id, legacyParagraphTextsFromFlow(sectionKey, hydrated)] as const;
      }),
    ),
  );
  await patchStringArray(`${sectionKey}.paragraphs`, paragraphLocales);

  await patchSectionListsFromFlow(sectionKey, flow, true);

  for (const key of textKeys) {
    const locales: LocaleTextValues = {};
    for (const id of getActiveLocaleIds()) {
      const messages = await messagesForLocale(id);
      const hydrated = hydrateFlowForLocale(flow, messages);
      const block = hydrated.find(
        (b) =>
          (b.type === "p" ||
            b.type === "heading" ||
            b.type === "sectionTitle" ||
            b.type === "button") &&
          b.textKey === key,
      );
      locales[id] =
        block?.type === "p" ||
        block?.type === "heading" ||
        block?.type === "sectionTitle" ||
        block?.type === "button"
          ? block.text
          : "";
    }
    await patchText(key, locales);
  }

  const flowForStorage = remapLegacyParagraphTextKeys(sectionKey, flow);
  await patchSectionFlow(
    sectionKey,
    flowForStorage.map((b) => stripFlowBlockForStorage(b)),
  );
}

export async function commitSectionFlowDrafts(
  flowDrafts: Record<string, FlowBlock[]>,
): Promise<void> {
  for (const [sectionKey, flow] of Object.entries(flowDrafts)) {
    if (isProseStyleSectionKey(sectionKey)) {
      await commitProseSectionFlow(sectionKey, flow);
    } else {
      await commitServiceSectionFlow(sectionKey, flow);
    }
  }
}
