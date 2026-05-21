// flow 블록 순서 — locale 파일 groups/lists/closing·prose paragraphs에 반영
import {
  fetchLocaleCatalog,
  patchSectionFlow,
  patchStringArray,
  patchText,
  type LocaleTextValues,
} from "@/lib/edit/client";
import {
  flowToProseSection,
  isProseStyleSectionKey,
} from "@/lib/edit/prose-flow";
import { stripFlowBlockForStorage } from "@/lib/edit/section-flow";
import {
  flowBulletItemEditKey,
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

async function commitServiceSectionFlow(
  sectionKey: string,
  flow: FlowBlock[],
): Promise<void> {
  const groupKeys = new Set<string>();
  const listItemKeys = new Set<string>();
  const listLeadKeys = new Set<string>();
  const closingKeys = new Set<string>();
  const textKeys = new Set<string>();

  for (const block of flow) {
    if (
      block.type === "p" ||
      block.type === "heading" ||
      block.type === "sectionTitle" ||
      block.type === "button"
    ) {
      textKeys.add(block.textKey);
    }
  }

  for (const id of getActiveLocaleIds()) {
    const messages = await messagesForLocale(id);
    const section = flowToSectionContent(hydrateFlowForLocale(flow, messages));

    section.groups?.forEach((group, gi) => {
      group.forEach((_, j) => {
        groupKeys.add(`${sectionKey}.groups.${gi}.${j}`);
      });
    });

    section.lists?.forEach((list, li) => {
      if (list.lead?.trim()) listLeadKeys.add(`${sectionKey}.lists.${li}.lead`);
      list.items.forEach((_, ii) => {
        listItemKeys.add(flowBulletItemEditKey(`${sectionKey}.lists.${li}`, ii));
      });
    });

    section.closing?.forEach((_, ci) => {
      closingKeys.add(`${sectionKey}.closing.${ci}`);
    });
  }

  for (const key of groupKeys) {
    const locales: LocaleTextValues = {};
    for (const id of getActiveLocaleIds()) {
      const messages = await messagesForLocale(id);
      const section = flowToSectionContent(hydrateFlowForLocale(flow, messages));
      const parts = key.slice(sectionKey.length + 1).split(".");
      const gi = Number(parts[1]);
      const j = Number(parts[2]);
      locales[id] = section.groups?.[gi]?.[j] ?? "";
    }
    await patchText(key, locales);
  }

  for (const key of listLeadKeys) {
    const locales: LocaleTextValues = {};
    for (const id of getActiveLocaleIds()) {
      const messages = await messagesForLocale(id);
      const section = flowToSectionContent(hydrateFlowForLocale(flow, messages));
      const li = Number(key.split(".lists.")[1]?.split(".")[0]);
      locales[id] = section.lists?.[li]?.lead ?? "";
    }
    await patchText(key, locales);
  }

  for (const listKey of new Set(
    [...listItemKeys].map((k) => k.replace(/\.items\.\d+$/, "")),
  )) {
    const locales = Object.fromEntries(
      await Promise.all(
        getActiveLocaleIds().map(async (id) => {
          const messages = await messagesForLocale(id);
          const section = flowToSectionContent(hydrateFlowForLocale(flow, messages));
          const li = Number(listKey.split(".lists.")[1]);
          return [id, section.lists?.[li]?.items ?? []] as const;
        }),
      ),
    );
    await patchStringArray(`${listKey}.items`, locales);
  }

  for (const key of closingKeys) {
    const locales: LocaleTextValues = {};
    for (const id of getActiveLocaleIds()) {
      const messages = await messagesForLocale(id);
      const section = flowToSectionContent(hydrateFlowForLocale(flow, messages));
      const ci = Number(key.split(".closing.")[1]);
      locales[id] = section.closing?.[ci] ?? "";
    }
    await patchText(key, locales);
  }

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
  const listLeadKeys = new Set<string>();
  const listItemKeys = new Set<string>();
  const textKeys = new Set<string>();

  for (const block of flow) {
    if (
      block.type === "p" ||
      block.type === "heading" ||
      block.type === "sectionTitle" ||
      block.type === "button"
    ) {
      textKeys.add(block.textKey);
    }
  }

  for (const id of getActiveLocaleIds()) {
    const messages = await messagesForLocale(id);
    const section = flowToProseSection(hydrateFlowForLocale(flow, messages));
    section.lists?.forEach((list, li) => {
      if (list.lead?.trim()) listLeadKeys.add(`${sectionKey}.lists.${li}.lead`);
      list.items.forEach((_, ii) => {
        listItemKeys.add(flowBulletItemEditKey(`${sectionKey}.lists.${li}`, ii));
      });
    });
  }

  const paragraphLocales = Object.fromEntries(
    await Promise.all(
      getActiveLocaleIds().map(async (id) => {
        const messages = await messagesForLocale(id);
        const section = flowToProseSection(hydrateFlowForLocale(flow, messages));
        return [id, section.paragraphs ?? []] as const;
      }),
    ),
  );
  await patchStringArray(`${sectionKey}.paragraphs`, paragraphLocales);

  for (const key of listLeadKeys) {
    const locales: LocaleTextValues = {};
    for (const id of getActiveLocaleIds()) {
      const messages = await messagesForLocale(id);
      const section = flowToProseSection(hydrateFlowForLocale(flow, messages));
      const li = Number(key.split(".lists.")[1]?.split(".")[0]);
      locales[id] = section.lists?.[li]?.lead ?? "";
    }
    await patchText(key, locales);
  }

  for (const listKey of new Set(
    [...listItemKeys].map((k) => k.replace(/\.items\.\d+$/, "")),
  )) {
    const locales = Object.fromEntries(
      await Promise.all(
        getActiveLocaleIds().map(async (id) => {
          const messages = await messagesForLocale(id);
          const section = flowToProseSection(hydrateFlowForLocale(flow, messages));
          const li = Number(listKey.split(".lists.")[1]);
          return [id, section.lists?.[li]?.items ?? []] as const;
        }),
      ),
    );
    await patchStringArray(`${listKey}.items`, locales);
  }

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
