// 함께 동기화할 locale 텍스트 키 그룹 (내비·페이지 제목·사이드바·섹션 제목)
import type { LocaleTextValues } from "@/lib/edit/client";
const SERVICES_SECTION_IDS = [
  "individual",
  "couples",
  "family",
  "play",
  "group",
  "christian",
] as const;

const SERVICE_AREAS_SECTION_IDS = [
  "depression",
  "traumaPtsd",
  "anxietyPanic",
  "suicidalThoughts",
  "culturalIdentity",
  "bipolar",
  "adhd",
  "relationship",
  "ocd",
  "eatingDisorders",
  "asd",
  "lifeStress",
  "griefLoss",
  "sleep",
] as const;

function sidebarSectionLinkGroups(
  prefix: "services" | "serviceAreas",
  ids: readonly string[],
): string[][] {
  return ids.map((id) => [
    `${prefix}.sidebar.${id}`,
    `${prefix}.sections.${id}.title`,
  ]);
}

const LINK_GROUPS: string[][] = [
  ["nav.contact", "contact.title"],
  ["nav.whoWeAre", "pages.whoWeAre.title"],
  ["nav.ourVision", "pages.ourVision.title"],
  ["nav.gettingStarted", "pages.gettingStarted.title"],
  ["nav.fee", "nav.feePage", "pages.fee.title"],
  ["nav.services", "nav.typesOfServices", "services.pageTitle"],
  ["nav.serviceAreas", "serviceAreas.pageTitle"],
  ...sidebarSectionLinkGroups("services", SERVICES_SECTION_IDS),
  ...sidebarSectionLinkGroups("serviceAreas", SERVICE_AREAS_SECTION_IDS),
];

const keyToGroupIndex = new Map<string, number>();
for (let i = 0; i < LINK_GROUPS.length; i++) {
  for (const key of LINK_GROUPS[i]) {
    keyToGroupIndex.set(key, i);
  }
}

/** 같은 그룹에 속한 모든 locale 키 (없으면 자기 자신만) */
export function getLinkedTextKeys(key: string): string[] {
  const idx = keyToGroupIndex.get(key);
  if (idx === undefined) return [key];
  return [...LINK_GROUPS[idx]];
}

/** pending 카운트·중복 커밋 방지용 그룹 id */
export function getLinkedTextKeyGroupId(key: string): string {
  const idx = keyToGroupIndex.get(key);
  return idx === undefined ? key : `link-group:${idx}`;
}

export function findLinkedDraft<T>(
  drafts: Record<string, T>,
  key: string,
): T | undefined {
  for (const k of getLinkedTextKeys(key)) {
    if (drafts[k] !== undefined) return drafts[k];
  }
  return undefined;
}

/** 커밋 시 그룹당 한 번만 patchText 호출 */
export function expandTextDraftsForCommit(
  drafts: Record<string, LocaleTextValues>,
): Array<[string, LocaleTextValues]> {
  const seen = new Set<number>();
  const out: Array<[string, LocaleTextValues]> = [];

  for (const [key, locales] of Object.entries(drafts)) {
    const idx = keyToGroupIndex.get(key);
    if (idx === undefined) {
      out.push([key, locales]);
      continue;
    }
    if (seen.has(idx)) continue;
    seen.add(idx);
    for (const k of LINK_GROUPS[idx]) {
      out.push([k, locales]);
    }
  }

  return out;
}
