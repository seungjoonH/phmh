"use client";

import { ProsePage } from "@/components/ui/ProsePage";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { pageHeroes } from "@/lib/page-heroes";

export function ThankYouPage() {
  const { messages } = useLocale();
  const p = messages.pages.thankYou;
  return (
    <ProsePage
      heroSrc={pageHeroes.contact}
      heroEditKey="heroes.contact"
      title={p.title}
      paragraphs={p.paragraphs}
      editKeyPrefix="pages.thankYou"
    />
  );
}
