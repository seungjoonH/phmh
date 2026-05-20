"use client";

import { PageVisibilityGuard } from "@/components/site/PageVisibilityGuard";
import { ProsePage } from "@/components/ui/ProsePage";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { pageHeroes } from "@/lib/page-heroes";

export function FeePage() {
  const { messages } = useLocale();
  const data = messages.pages.fee;

  return (
    <PageVisibilityGuard pageId="fee.fee">
      <ProsePage
        heroSrc={pageHeroes.fee}
        heroEditKey="heroes.fee"
        title={data.title}
        paragraphs={data.paragraphs}
        editKeyPrefix="pages.fee"
      />
    </PageVisibilityGuard>
  );
}
