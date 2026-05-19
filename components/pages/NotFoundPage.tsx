"use client";

import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { getContactPath } from "@/lib/contact";

export function NotFoundPage() {
  const { locale, messages } = useLocale();
  const p = messages.pages.notFound;

  const quickLinks = [
    { href: "/about/who-we-are", label: p.homeLink },
    { href: "/getting-started", label: messages.nav.gettingStarted },
    { href: getContactPath(locale), label: messages.nav.contact },
  ] as const;

  return (
    <article className="min-h-[min(72vh,42rem)]">
      <div className="page-container flex flex-col items-center justify-center py-20 text-center md:py-28">
        <Reveal>
          <p
            className="font-logo text-7xl font-bold tabular-nums tracking-tight text-page-heading/25 md:text-8xl"
            aria-hidden
          >
            404
          </p>
          <h1 className="page-title mt-2">{p.title}</h1>
          <div className="page-title-rule" />
          <p className="mx-auto mt-8 max-w-lg text-base leading-relaxed text-page-body/80 md:text-lg">
            {p.description}
          </p>
        </Reveal>

        <Reveal className="mt-14 w-full max-w-3xl">
          <p className="mb-5 text-sm font-semibold uppercase tracking-wide text-secondary">
            {p.linksHeading}
          </p>
          <ul className="grid gap-4 sm:grid-cols-3">
            {quickLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="interactive-link flex h-full min-h-[4.5rem] flex-col items-center justify-center rounded-sm border border-page-body/10 bg-page-bg px-4 py-5 text-page-heading ring-1 ring-transparent transition-[background-color,box-shadow,ring-color] hover:bg-page-body/[0.03] hover:shadow-sm hover:ring-page-heading/10"
                >
                  <span className="font-logo text-lg">{link.label}</span>
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/about/who-we-are" className="cta-primary mt-10 inline-block">
            {p.homeCta}
          </Link>
        </Reveal>
      </div>
    </article>
  );
}
