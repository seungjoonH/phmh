"use client";

// 글로벌 푸터
import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Reveal } from "@/components/motion/Reveal";
import { accordionPanel, duration, easeCalm, motionTransition } from "@/lib/motion";
import { EditableNavLabel } from "@/components/edit/EditableNavLabel";
import { EditableTherapistNavLabel } from "@/components/edit/EditableTherapistNavLabel";
import { EditableImage } from "@/components/edit/EditableImage";
import { EditableText } from "@/components/edit/EditableText";
import { editTextAttrs } from "@/lib/edit/attrs";
import { isEditMode } from "@/lib/edit/env";
import { useLocale, useTranslations } from "@/components/i18n/LocaleProvider";
import { getNavigation, navChildLabel, type NavItem } from "@/lib/navigation";
import type { Locale } from "@/lib/contact";
import { useVisibilityEpoch } from "@/lib/edit/use-visibility-epoch";
import {
  getKoreaAddress,
  getKoreaEmail,
  getKoreaPhone,
  getPhilippinesAddressFull,
  getPhilippinesEmail,
  getPhilippinesPhoneViber,
} from "@/lib/contact-info";

export function SiteFooter() {
  const t = useTranslations();
  const { locale, messages } = useLocale();
  useVisibilityEpoch();
  const nav = getNavigation(locale);

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
              <FooterNavList nav={nav} t={t} locale={locale} />
            </div>

            <div>
              <h3
                className="mb-4 font-logo text-xl underline decoration-primary-foreground underline-offset-4"
                {...editTextAttrs("footer.contact")}
              >
                {t("footer.contact")}
              </h3>
              <div className="space-y-6 text-sm">
                <ContactCenterBlock
                  centerLabel={t("nav.koreaCenter")}
                  addressKey="siteContact.korea.address"
                  address={getKoreaAddress(messages)}
                  phoneKey="siteContact.korea.phone"
                  phone={getKoreaPhone(messages)}
                  email={getKoreaEmail(messages)}
                />
                <ContactCenterBlock
                  centerLabel={t("nav.philippinesCenter")}
                  addressKey="siteContact.philippines.addressFull"
                  address={getPhilippinesAddressFull(messages)}
                  phoneKey="siteContact.philippines.phoneViber"
                  phone={getPhilippinesPhoneViber(messages)}
                  email={getPhilippinesEmail(messages)}
                />
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </footer>
  );
}

function ContactCenterBlock({
  centerLabel,
  addressKey,
  address,
  phoneKey,
  phone,
  email,
}: {
  centerLabel: string;
  addressKey: string;
  address: string;
  phoneKey: string;
  phone: string;
  email: string;
}) {
  const editMode = isEditMode();
  const showAddress = editMode || address.trim() !== "";
  const showPhone = editMode || phone.trim() !== "";

  return (
    <div>
      <p className="font-semibold">{centerLabel}</p>
      {showAddress && (
        <EditableText as="p" className="mt-2 opacity-90" editKey={addressKey}>
          {address}
        </EditableText>
      )}
      {showPhone && (
        <EditableText as="p" className="mt-2 opacity-90" editKey={phoneKey}>
          {phone}
        </EditableText>
      )}
      <p className="mt-2">
        <a
          href={`mailto:${email}`}
          className="interactive-link hover:text-link-active"
        >
          {email}
        </a>
      </p>
    </div>
  );
}

const footerNavLinkClass =
  "interactive-link underline-offset-4 decoration-primary-foreground hover:underline hover:text-link-active";

function FooterNavList({
  nav,
  t,
  locale,
}: {
  nav: NavItem[];
  t: (k: string) => string;
  locale: Locale;
}) {
  const reduce = useReducedMotion();
  const layoutTransition = reduce
    ? { duration: 0 }
    : { layout: { duration: duration.fast, ease: easeCalm } };

  return (
    <ul className="flex flex-col gap-2 text-sm">
      {nav.map((item) => (
        <motion.li
          key={item.labelKey}
          layout
          transition={layoutTransition}
          className="overflow-hidden"
        >
          <FooterNavItem item={item} t={t} locale={locale} reduce={reduce} />
        </motion.li>
      ))}
    </ul>
  );
}

function FooterNavItem({
  item,
  t,
  locale,
  reduce,
}: {
  item: NavItem;
  t: (k: string) => string;
  locale: Locale;
  reduce: boolean | null;
}) {
  const [open, setOpen] = useState(false);
  const submenuTransition = motionTransition(reduce, { duration: duration.fast });

  if (!item.children) {
    return (
      <Link href={item.href} className={footerNavLinkClass}>
        <EditableNavLabel labelKey={item.labelKey}>
          {t(item.labelKey)}
        </EditableNavLabel>
      </Link>
    );
  }

  return (
    <div
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <Link href={item.href} className={footerNavLinkClass}>
        <EditableNavLabel labelKey={item.labelKey}>
          {t(item.labelKey)}
        </EditableNavLabel>
      </Link>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="footer-submenu"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={accordionPanel}
            transition={submenuTransition}
            className="overflow-hidden"
          >
            <ul className="mt-1 space-y-1 border-l border-primary-foreground/25 pl-3 text-primary-foreground/85">
              {item.children.map((child) => (
                <li key={child.href}>
                  <Link href={child.href} className={footerNavLinkClass}>
                    {child.therapistSlug ? (
                      <EditableTherapistNavLabel slug={child.therapistSlug} />
                    ) : child.labelKey ? (
                      <EditableNavLabel labelKey={child.labelKey}>
                        {navChildLabel(child, t, locale)}
                      </EditableNavLabel>
                    ) : (
                      <span>{navChildLabel(child, t, locale)}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
