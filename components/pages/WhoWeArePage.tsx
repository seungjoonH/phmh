"use client";

import { ProsePage } from "@/components/ui/ProsePage";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { coerceStringArray } from "@/lib/edit/get-message-array";
import { pageHeroes } from "@/lib/page-heroes";

export function WhoWeArePage() {
  const { messages } = useLocale();
  const p = messages.pages.whoWeAre;

  return (
    <ProsePage
      heroSrc={pageHeroes.about}
      heroEditKey="heroes.about"
      title={p.title}
      paragraphs={coerceStringArray(p.paragraphs)}
      editKeyPrefix="pages.whoWeAre"
    />
  );
}
