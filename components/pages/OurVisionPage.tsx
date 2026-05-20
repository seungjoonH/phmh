"use client";

import { PageVisibilityGuard } from "@/components/site/PageVisibilityGuard";
import { ProsePage } from "@/components/ui/ProsePage";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { pageHeroes } from "@/lib/page-heroes";

export function OurVisionPage() {
  const { messages } = useLocale();
  const p = messages.pages.ourVision;
  return (
    <PageVisibilityGuard pageId="about.our-vision">
      <ProsePage
        heroSrc={pageHeroes.about}
        heroEditKey="heroes.about"
        title={p.title}
        paragraphs={p.paragraphs}
        editKeyPrefix="pages.ourVision"
      />
    </PageVisibilityGuard>
  );
}
