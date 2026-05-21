"use client";

import { PageVisibilityGuard } from "@/components/site/PageVisibilityGuard";
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
import { isImageKeyHidden } from "@/lib/image-hidden";
import { pageHeroes } from "@/lib/page-heroes";
import {
  therapyAnchors,
  therapyImages,
} from "@/lib/service-images";

const defaultKeys = [
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
      labelEditKey: "services.sidebar.top",
    },
    ...order.map((k) => {
      const anchor = therapyAnchors[k] ?? k;
      const sec = sectionsMap[k];
      return {
        id: anchor,
        label: sec?.title ?? "",
        href: `#${anchor}`,
        labelEditKey: `services.sections.${k}.title`,
        orderKey: k,
      };
    }),
  ];

  const sections = order.map((k) => {
    const sec = sectionsMap[k] ?? ({ title: "" } as StructuredSection);
    const anchor = therapyAnchors[k] ?? k;
    const imageKey = `therapy.${k}`;
    const hasDefaultImage = k in therapyImages && !isImageKeyHidden(imageKey);
    return {
      id: anchor,
      title: sec.title,
      imageSrc: hasDefaultImage ? therapyImages[k] : undefined,
      // 모든 섹션이 헤더 이미지 자리(0 or 1)를 가진다. 이미지가 없는 섹션은 edit 모드에서만
      // dashed placeholder 가 보이고, dev/prod 에서는 ParallaxMedia 분기 자체가 렌더되지 않아
      // 빈 공간을 차지하지 않는다(ServiceSection 의 `!useFlowLayout && imageSrc` 조건).
      imageEditKey: `therapy.${k}`,
      textKeyPrefix: `services.sections.${k}`,
      groups: sec.groups ?? [],
      lists: sec.lists ?? [],
      subsections: sec.subsections ?? [],
      closing: sec.closing,
    };
  });

  return (
    <PageVisibilityGuard pageId="services.types">
    <LongFormPage
      heroSrc={pageHeroes.servicesTypes}
      heroEditKey="heroes.servicesTypes"
      pageTitleEditKey="services.pageTitle"
      pageTitle={data.pageTitle}
      sidebar={sidebar}
      sections={sections}
      sectionOrderKey="services.sectionOrder"
      ctaLabel={t("common.scheduleConsultation")}
      ctaHref={getContactPath(locale)}
      ctaEditKey="common.scheduleConsultation"
    />
    </PageVisibilityGuard>
  );
}
