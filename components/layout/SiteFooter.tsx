"use client";

// 글로벌 푸터
import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";
import { EditableNavLabel } from "@/components/edit/EditableNavLabel";
import { EditableImage } from "@/components/edit/EditableImage";
import { EditableText } from "@/components/edit/EditableText";
import { editTextAttrs } from "@/lib/edit/attrs";
import { useLocale, useTranslations } from "@/components/i18n/LocaleProvider";
import { getNavigation } from "@/lib/navigation";
import { useVisibilityEpoch } from "@/lib/edit/use-visibility-epoch";
import {
  getContactEmailDisplay,
  getKoreaAddress,
  getPhilippinesAddressFull,
  getPhilippinesPhoneViber,
} from "@/lib/contact-info";

export function SiteFooter() {
  const t = useTranslations();
  const { locale, messages } = useLocale();
  useVisibilityEpoch();
  const nav = getNavigation(locale);
  const email = getContactEmailDisplay(messages);

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <Reveal variant="fade">
          <div className="grid gap-10 md:grid-cols-3 md:gap-12">
            <div>
              <EditableImage
                editKey="site.logoLight"
                src="/logo-light.png"
                alt={t("common.logoAlt")}
                width={600}
                height={212}
                className="h-auto w-full max-w-[280px]"
              />
            </div>

            <div>
              <h3
                className="mb-4 font-logo text-xl underline decoration-primary-foreground underline-offset-4"
                {...editTextAttrs("footer.menu")}
              >
                {t("footer.menu")}
              </h3>
              <ul className="space-y-2 text-sm">
                {nav.map((item) => (
                  <li key={item.labelKey}>
                    <Link
                      href={item.href}
                      className="interactive-link underline-offset-4 decoration-primary-foreground hover:underline hover:text-link-active"
                    >
                      <EditableNavLabel labelKey={item.labelKey}>
                        {t(item.labelKey)}
                      </EditableNavLabel>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3
                className="mb-4 font-logo text-xl underline decoration-primary-foreground underline-offset-4"
                {...editTextAttrs("footer.contact")}
              >
                {t("footer.contact")}
              </h3>
              <div className="space-y-6 text-sm">
                <div>
                  <p className="font-semibold">{t("nav.koreaCenter")}</p>
                  <EditableText
                    as="p"
                    className="mt-2 opacity-90"
                    editKey="siteContact.korea.address"
                  >
                    {getKoreaAddress(messages)}
                  </EditableText>
                  <p className="mt-2">
                    <a
                      href={`mailto:${email}`}
                      className="interactive-link hover:text-link-active"
                    >
                      <EditableText editKey="siteContact.email" as="span" longPress={false}>
                        {email}
                      </EditableText>
                    </a>
                  </p>
                </div>
                <div>
                  <p className="font-semibold">{t("nav.philippinesCenter")}</p>
                  <EditableText
                    as="p"
                    className="mt-2 opacity-90"
                    editKey="siteContact.philippines.addressFull"
                  >
                    {getPhilippinesAddressFull(messages)}
                  </EditableText>
                  <EditableText
                    as="p"
                    className="mt-2"
                    editKey="siteContact.philippines.phoneViber"
                  >
                    {getPhilippinesPhoneViber(messages)}
                  </EditableText>
                  <p className="mt-2">
                    <a
                      href={`mailto:${email}`}
                      className="interactive-link hover:text-link-active"
                    >
                      <EditableText editKey="siteContact.email" as="span" longPress={false}>
                        {email}
                      </EditableText>
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </footer>
  );
}
