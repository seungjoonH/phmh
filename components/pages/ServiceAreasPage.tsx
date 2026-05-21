"use client";

import { PageVisibilityGuard } from "@/components/site/PageVisibilityGuard";
import { LongFormPage } from "@/components/ui/LongFormPage";
import type { ContentSubsection, ListBlock } from "@/components/ui/ServiceSection";

type StructuredSection = {
  title: string;
  tagline?: string;
  groups?: string[][];
  lists?: ListBlock[];
  subsections?: ContentSubsection[];
  closing?: string[];
};
import { useLocale } from "@/components/i18n/LocaleProvider";
import { getContactPath } from "@/lib/contact";
import { isImageKeyHidden } from "@/lib/image-hidden";
import { pageHeroes } from "@/lib/page-heroes";
import { areaAnchors, areaImages } from "@/lib/service-images";

const defaultKeys = [
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

export function ServiceAreasPage() {
  const { locale, messages, t } = useLocale();
  const data = messages.serviceAreas;
  const sectionsMap = data.sections as unknown as Record<string, StructuredSection>;
  const rawOrder = (data as { sectionOrder?: unknown }).sectionOrder;
  const order: string[] = Array.isArray(rawOrder)
    ? (rawOrder.filter((v): v is string => typeof v === "string"))
    : [...defaultKeys];

  const sidebar = [
    {
      id: "top",
      label: data.sidebar.top,
      href: "#top",
      labelEditKey: "serviceAreas.sidebar.top",
    },
    ...order.map((k) => {
      const anchor = areaAnchors[k] ?? k;
      const sec = sectionsMap[k];
      return {
        id: anchor,
        label: sec?.title ?? "",
        href: `#${anchor}`,
        labelEditKey: `serviceAreas.sections.${k}.title`,
        orderKey: k,
      };
    }),
  ];

  const sections = order.map((k) => {
    const sec = sectionsMap[k] ?? ({ title: "" } as StructuredSection);
    const anchor = areaAnchors[k] ?? k;
    const imageKey = `area.${k}`;
    const hasDefaultImage = k in areaImages && !isImageKeyHidden(imageKey);
    return {
      id: anchor,
      title: sec.title,
      imageSrc: hasDefaultImage ? areaImages[k] : undefined,
      // 모든 섹션이 헤더 이미지 자리(0 or 1)를 가진다 — edit 모드에서만 placeholder 표시,
      // dev/prod 에서는 imageSrc 가 없으면 ParallaxMedia 분기가 렌더되지 않는다.
      imageEditKey: `area.${k}`,
      textKeyPrefix: `serviceAreas.sections.${k}`,
      tagline: sec.tagline || undefined,
      groups: sec.groups ?? [],
      lists: sec.lists ?? [],
      subsections: sec.subsections ?? [],
      closing: sec.closing ?? [],
    };
  });

  return (
    <PageVisibilityGuard pageId="services.areas">
    <LongFormPage
      heroSrc={pageHeroes.serviceAreas}
      heroEditKey="heroes.serviceAreas"
      pageTitleEditKey="serviceAreas.pageTitle"
      pageTitle={data.pageTitle}
      sidebar={sidebar}
      sections={sections}
      sectionOrderKey="serviceAreas.sectionOrder"
      ctaLabel={t("common.scheduleConsultation")}
      ctaHref={getContactPath(locale)}
      ctaEditKey="common.scheduleConsultation"
    />
    </PageVisibilityGuard>
  );
}
