"use client";

// Contact 페이지 레이아웃
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Reveal } from "@/components/motion/Reveal";
import {
  ContactCenterToggle,
  type ContactCenter,
} from "./ContactCenterToggle";
import { ContactForm } from "./ContactForm";
import { EditableText } from "@/components/edit/EditableText";
import { PageHeroBanner } from "@/components/ui/PageHeroBanner";
import { editTextAttrs } from "@/lib/edit/attrs";
import { useLocale, useTranslations } from "@/components/i18n/LocaleProvider";
import {
  getContactEmailDisplay,
  getKoreaAddress,
  getPhilippinesAddressShort,
  getPhilippinesPhone,
} from "@/lib/contact-info";
import { pageHeroes } from "@/lib/page-heroes";
import { siteConfig } from "@/lib/config";
import { duration, motionTransition } from "@/lib/motion";

function centerFromPath(pathname: string): ContactCenter {
  return pathname.includes("philippines") ? "philippines" : "korea";
}

type Props = {
  center: ContactCenter;
};

function ContactEmailLink({ className }: { className?: string }) {
  const { messages } = useLocale();
  const email = getContactEmailDisplay(messages);
  return (
    <a href={`mailto:${email}`} className={className}>
      <EditableText editKey="siteContact.email" as="span" longPress={false}>
        {email}
      </EditableText>
    </a>
  );
}

export function ContactPageLayout({ center: initialCenter }: Props) {
  const t = useTranslations();
  const { messages } = useLocale();
  const reduce = useReducedMotion();
  const [center, setCenter] = useState<ContactCenter>(initialCenter);

  useEffect(() => {
    setCenter(initialCenter);
  }, [initialCenter]);

  useEffect(() => {
    const onPopState = () => {
      setCenter(centerFromPath(window.location.pathname));
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const switchCenter = (next: ContactCenter) => {
    if (next === center) return;
    setCenter(next);
    const path =
      next === "korea"
        ? siteConfig.contact.koreaPath
        : siteConfig.contact.philippinesPath;
    window.history.replaceState(null, "", path);
  };

  const prefix = `contact.${center}`;

  return (
    <article>
      <PageHeroBanner src={pageHeroes.contact} editKey="heroes.contact" />
      <div className="page-container">
        <Reveal>
          <h1 className="page-title" {...editTextAttrs("contact.title")}>
            {t("contact.title")}
          </h1>
          <div className="page-title-rule" />
        </Reveal>
        <Reveal delay={0.08} className="mx-auto mt-12 max-w-5xl border border-page-body/15 p-6 md:p-10">
          <div className="flex flex-col gap-10 lg:flex-row">
            <div className="lg:w-[70%]">
              <ContactForm center={center} />
            </div>
            <aside className="lg:w-[30%] text-page-body">
              <ContactCenterToggle value={center} onChange={switchCenter} />
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={center}
                  initial={reduce ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={reduce ? undefined : { opacity: 0 }}
                  transition={motionTransition(reduce, { duration: duration.fast })}
                >
                  <EditableText
                    as="h2"
                    className="mb-2 font-logo text-xl text-page-heading"
                    editKey={`${prefix}.addressTitle`}
                  >
                    {t(`${prefix}.addressTitle`)}
                  </EditableText>
                  {center === "korea" ? (
                    <EditableText
                      as="p"
                      className="text-sm"
                      editKey="siteContact.korea.address"
                    >
                      {getKoreaAddress(messages)}
                    </EditableText>
                  ) : (
                    <>
                      <EditableText
                        as="p"
                        className="text-sm"
                        editKey="siteContact.philippines.addressShort"
                      >
                        {getPhilippinesAddressShort(messages)}
                      </EditableText>
                      <EditableText
                        as="p"
                        className="mt-4 text-sm"
                        editKey="siteContact.philippines.phone"
                      >
                        {getPhilippinesPhone(messages)}
                      </EditableText>
                    </>
                  )}
                  <p className="mt-4 text-sm">
                    <ContactEmailLink className="interactive-link hover:text-page-heading" />
                  </p>
                  <EditableText
                    as="h2"
                    className="mb-2 mt-8 font-logo text-xl text-page-heading"
                    editKey={`${prefix}.hoursTitle`}
                  >
                    {t(`${prefix}.hoursTitle`)}
                  </EditableText>
                  <EditableText
                    as="p"
                    className="text-sm"
                    editKey={`${prefix}.hoursWeekday`}
                  >
                    {t(`${prefix}.hoursWeekday`)}
                  </EditableText>
                  <EditableText
                    as="p"
                    className="text-sm"
                    editKey={`${prefix}.hoursWeekend`}
                  >
                    {t(`${prefix}.hoursWeekend`)}
                  </EditableText>
                  <EditableText
                    as="p"
                    className="mt-2 text-sm italic"
                    editKey={`${prefix}.virtualNote`}
                  >
                    {t(`${prefix}.virtualNote`)}
                  </EditableText>
                </motion.div>
              </AnimatePresence>
            </aside>
          </div>
        </Reveal>
      </div>
    </article>
  );
}
