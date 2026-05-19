"use client";

// sticky 사이드바 + 롱폼 본문
import { Reveal } from "@/components/motion/Reveal";
import { LongFormNavLink } from "@/components/ui/LongFormNavLink";
import { editTextAttrs } from "@/lib/edit/attrs";
import { PageHeroBanner } from "./PageHeroBanner";
import {
  ServiceSection,
  type ContentSubsection,
  type ListBlock,
} from "./ServiceSection";

export type SidebarItem = {
  id: string;
  label: string;
  href: string;
  labelEditKey?: string;
};
export type SectionData = {
  id: string;
  title: string;
  imageSrc?: string;
  tagline?: string;
  intro?: string[];
  groups?: string[][];
  lists?: ListBlock[];
  closing?: string[];
  subsections?: ContentSubsection[];
  blocks?: { heading?: string; paragraphs?: string[]; bullets?: string[] }[];
  bullets?: string[];
  textKeyPrefix?: string;
  imageEditKey?: string;
};

type Props = {
  pageTitle: string;
  heroSrc: string;
  heroEditKey?: string;
  pageTitleEditKey?: string;
  sidebar: SidebarItem[];
  sections: SectionData[];
  ctaLabel: string;
  ctaHref: string;
  ctaEditKey?: string;
};

export function LongFormPage({
  pageTitle,
  heroSrc,
  heroEditKey,
  pageTitleEditKey,
  sidebar,
  sections,
  ctaLabel,
  ctaHref,
  ctaEditKey,
}: Props) {
  return (
    <article>
      <PageHeroBanner src={heroSrc} editKey={heroEditKey} />
      <div className="page-container scroll-mt-28" id="top">
        <Reveal>
          <h1
            className="page-title"
            {...(pageTitleEditKey ? editTextAttrs(pageTitleEditKey) : {})}
          >
            {pageTitle}
          </h1>
          <div className="page-title-rule" />
        </Reveal>
        <div className="mt-12 flex flex-col gap-12 lg:flex-row">
          <aside className="lg:w-1/4">
            <nav
              className="sticky top-28 z-10 self-start text-sm text-secondary"
              aria-label="Section navigation"
            >
              <Reveal variant="fade" delay={0.08}>
                <ul className="flex flex-col gap-4">
                  {sidebar.map((item) => (
                    <li key={item.id}>
                      <LongFormNavLink
                        href={item.href}
                        label={item.label}
                        labelEditKey={item.labelEditKey}
                      />
                    </li>
                  ))}
                </ul>
              </Reveal>
            </nav>
          </aside>
          <div className="lg:w-3/4">
            {sections.map((section, i) => (
              <ServiceSection
                key={section.id}
                {...section}
                ctaLabel={ctaLabel}
                ctaHref={ctaHref}
                ctaEditKey={ctaEditKey}
                revealDelay={i * 0.05}
              />
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
