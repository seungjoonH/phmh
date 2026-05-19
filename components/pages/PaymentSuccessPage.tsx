"use client";

import { ProsePage } from "@/components/ui/ProsePage";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { pageHeroes } from "@/lib/page-heroes";

export function PaymentSuccessPage() {
  const { messages } = useLocale();
  const p = messages.pages.paymentSuccess;
  return (
    <ProsePage
      heroSrc={pageHeroes.fee}
      heroEditKey="heroes.fee"
      title={p.title}
      paragraphs={p.paragraphs}
      editKeyPrefix="pages.paymentSuccess"
    />
  );
}
