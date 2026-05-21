"use client";

// Contact 페이지 레이아웃
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { PageVisibilityGuard } from "@/components/site/PageVisibilityGuard";
import { Reveal } from "@/components/motion/Reveal";
import {
  ContactCenterToggle,
  type ContactCenter,
  type ContactCenterToggleHandle,
} from "./ContactCenterToggle";
import { ContactForm } from "./ContactForm";
import { ContactMapEmbed } from "./ContactMapEmbed";
import { EditableBodyFlow } from "@/components/edit/EditableBodyFlow";
import { EditableText } from "@/components/edit/EditableText";
import { PageHeroBanner } from "@/components/ui/PageHeroBanner";
import { editTextAttrs } from "@/lib/edit/attrs";
import { isEditMode } from "@/lib/edit/env";
import { useLocale, useTranslations } from "@/components/i18n/LocaleProvider";
import {
  getKoreaAddress,
  getKoreaEmail,
  getKoreaPhone,
  getPhilippinesAddressShort,
  getPhilippinesEmail,
  getPhilippinesPhone,
} from "@/lib/contact-info";
import { getContactMapEmbedSrc } from "@/lib/contact-map-embed";
import { pageHeroes } from "@/lib/page-heroes";
import { siteConfig } from "@/lib/config";
import { duration, motionTransition } from "@/lib/motion";

function centerFromPath(pathname: string): ContactCenter {
  return pathname.includes("philippines") ? "philippines" : "korea";
}

type Props = {
  center: ContactCenter;
};

function ContactEmailLink({
  center,
  className,
}: {
  center: ContactCenter;
  className?: string;
}) {
  const { messages } = useLocale();
  const email =
    center === "korea" ? getKoreaEmail(messages) : getPhilippinesEmail(messages);
  const emailKey =
    center === "korea" ? "siteContact.korea.email" : "siteContact.philippines.email";
  return (
    <a href={`mailto:${email}`} className={className}>
      <EditableText editKey={emailKey} as="span" longPress={false}>
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
  const toggleRef = useRef<ContactCenterToggleHandle>(null);

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
  const pageId = center === "korea" ? "contact.korea" : "contact.philippines";

  return (
    <PageVisibilityGuard pageId={pageId}>
    <article>
      <PageHeroBanner src={pageHeroes.contact} editKey="heroes.contact" />
      <div className="page-container">
        <Reveal>
          <h1 className="page-title" {...editTextAttrs("contact.title")}>
            {t("contact.title")}
          </h1>
          <div className="page-title-rule" />
        </Reveal>
        <Reveal
          delay={0.08}
          className={`mx-auto mt-12 max-w-5xl border border-page-body/15 p-6 md:p-10 ${
            isEditMode() ? "pl-10 md:pl-12" : ""
          }`}
        >
          <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,3fr)]">
            <div className="min-w-0 w-full">
              <EditableBodyFlow
                sectionKey={`${prefix}.body`}
                fallbackSection={{ paragraphs: [] }}
                className="mb-8"
              />
              <ContactForm
                center={center}
                onResidencyDecline={() => toggleRef.current?.highlight()}
              />
            </div>
            <aside className="min-w-0 w-full text-page-body">
              <ContactCenterToggle
                ref={toggleRef}
                value={center}
                onChange={switchCenter}
              />
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={center}
                  className="w-full"
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
                    <>
                      <EditableText
                        as="p"
                        className="text-sm"
                        editKey="siteContact.korea.address"
                      >
                        {getKoreaAddress(messages)}
                      </EditableText>
                      <ContactMapEmbed
                        src={getContactMapEmbedSrc("korea", messages)}
                        title={t("contact.mapTitleKorea")}
                      />
                    </>
                  ) : (
                    <>
                      <EditableText
                        as="p"
                        className="text-sm"
                        editKey="siteContact.philippines.addressShort"
                      >
                        {getPhilippinesAddressShort(messages)}
                      </EditableText>
                      <ContactMapEmbed
                        src={getContactMapEmbedSrc("philippines", messages)}
                        title={t("contact.mapTitlePhilippines")}
                      />
                    </>
                  )}
                  <EditableText
                    as="h2"
                    className="mb-2 mt-8 font-logo text-xl text-page-heading"
                    editKey={`${prefix}.contactTitle`}
                  >
                    {t(`${prefix}.contactTitle`)}
                  </EditableText>
                  {(() => {
                    const phoneKey =
                      center === "korea"
                        ? "siteContact.korea.phone"
                        : "siteContact.philippines.phone";
                    const phoneValue =
                      center === "korea"
                        ? getKoreaPhone(messages)
                        : getPhilippinesPhone(messages);
                    const showPhone =
                      isEditMode() || phoneValue.trim() !== "";
                    return (
                      <>
                        {showPhone && (
                          <EditableText
                            as="p"
                            className="text-sm"
                            editKey={phoneKey}
                          >
                            {phoneValue}
                          </EditableText>
                        )}
                        <p className={showPhone ? "mt-4 text-sm" : "text-sm"}>
                          <ContactEmailLink
                            center={center}
                            className="interactive-link hover:text-page-heading"
                          />
                        </p>
                      </>
                    );
                  })()}
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
    </PageVisibilityGuard>
  );
}
