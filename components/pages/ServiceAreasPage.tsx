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
import { pageHeroes } from "@/lib/page-heroes";
import { areaAnchors, areaImages } from "@/lib/service-images";

const keys = [
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

  const sidebar = [
    {
      id: "top",
      label: data.sidebar.top,
      href: "#top",
      labelEditKey: "serviceAreas.sidebar.top",
    },
    ...keys.map((k) => ({
      id: areaAnchors[k],
      label: data.sidebar[k],
      href: `#${areaAnchors[k]}`,
      labelEditKey: `serviceAreas.sidebar.${k}`,
    })),
  ];

  const sections = keys.map((k) => {
    const sec = data.sections[k] as StructuredSection;
    return {
      id: areaAnchors[k],
      title: sec.title,
      imageSrc: k === "depression" ? undefined : areaImages[k],
      imageEditKey: k === "depression" ? undefined : `area.${k}`,
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
      ctaLabel={t("common.scheduleConsultation")}
      ctaHref={getContactPath(locale)}
      ctaEditKey="common.scheduleConsultation"
    />
    </PageVisibilityGuard>
  );
}
