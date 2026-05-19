"use client";

import { LongFormPage } from "@/components/ui/LongFormPage";
import type { ContentSubsection, ListBlock } from "@/components/ui/ServiceSection";

type StructuredSection = {
  title: string;
  groups?: string[][];
  lists?: ListBlock[];
  subsections?: ContentSubsection[];
  closing?: string[];
};
import { useLocale } from "@/components/i18n/LocaleProvider";
import { getContactPath } from "@/lib/contact";
import { pageHeroes } from "@/lib/page-heroes";
import {
  therapyAnchors,
  therapyImages,
} from "@/lib/service-images";

const keys = [
  "individual",
  "couples",
  "family",
  "play",
  "group",
  "christian",
] as const;

export function ServicesTypesPage() {
  const { locale, messages, t } = useLocale();
  const data = messages.services;

  const sidebar = [
    {
      id: "top",
      label: data.sidebar.top,
      href: "#top",
      labelEditKey: "services.sidebar.top",
    },
    ...keys.map((k) => ({
      id: therapyAnchors[k],
      label: data.sidebar[k],
      href: `#${therapyAnchors[k]}`,
      labelEditKey: `services.sidebar.${k}`,
    })),
  ];

  const sections = keys.map((k) => {
    const sec = data.sections[k] as StructuredSection;
    return {
      id: therapyAnchors[k],
      title: sec.title,
      imageSrc: k === "individual" ? undefined : therapyImages[k],
      imageEditKey: k === "individual" ? undefined : `therapy.${k}`,
      textKeyPrefix: `services.sections.${k}`,
      groups: sec.groups ?? [],
      lists: sec.lists ?? [],
      subsections: sec.subsections ?? [],
      closing: sec.closing,
    };
  });

  return (
    <LongFormPage
      heroSrc={pageHeroes.servicesTypes}
      heroEditKey="heroes.servicesTypes"
      pageTitleEditKey="services.pageTitle"
      pageTitle={data.pageTitle}
      sidebar={sidebar}
      sections={sections}
      ctaLabel={t("common.scheduleConsultation")}
      ctaHref={getContactPath(locale)}
      ctaEditKey="common.scheduleConsultation"
    />
  );
}
