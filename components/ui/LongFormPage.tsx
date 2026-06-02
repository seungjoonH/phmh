"use client";

// sticky 사이드바 + 롱폼 본문
import { Fragment, useEffect, useState } from "react";
import { Reveal } from "@/components/motion/Reveal";
import { EditAddPill } from "@/components/edit/EditAddPill";
import { EditInlineControls } from "@/components/edit/EditInlineControls";
import { useEditDraftOptional } from "@/components/edit/EditDraftProvider";
import { EditReorderList } from "@/components/edit/EditReorderList";
import { EditReorderRow } from "@/components/edit/EditReorderRow";
import { useEditReorderDrag } from "@/components/edit/useEditReorderDrag";
import { LongFormNavLink } from "@/components/ui/LongFormNavLink";
import { editTextAttrs } from "@/lib/edit/attrs";
import { isEditMode } from "@/lib/edit/env";
import { getActiveLocaleIds } from "@/lib/site-locales";
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
  orderKey?: string;
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
  heroFallbackSrc?: string;
  heroEditKey?: string;
  pageTitleEditKey?: string;
  sidebar: SidebarItem[];
  sections: SectionData[];
  ctaLabel: string;
  ctaHref: string;
  ctaEditKey?: string;
  sectionOrderKey?: string;
};

export function LongFormPage({
  pageTitle,
  heroSrc,
  heroFallbackSrc,
  heroEditKey,
  pageTitleEditKey,
  sidebar,
  sections,
  ctaLabel,
  ctaHref,
  ctaEditKey,
  sectionOrderKey,
}: Props) {
  const edit = useEditDraftOptional();
  const reorderEnabled = Boolean(edit) && isEditMode() && Boolean(sectionOrderKey);
  const fixedItem = sidebar.find((item) => item.id === "top");
  const orderItems = sidebar.filter(
    (item) => item.id !== "top" && Boolean(item.orderKey),
  );
  const drag = useEditReorderDrag();
  const sectionBusy = Boolean(
    sectionOrderKey && edit?.longFormSectionBusy === sectionOrderKey,
  );

  const handleReorder = (from: number, to: number) => {
    if (!sectionOrderKey || !edit) return;
    const next = [...orderItems];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    const newOrder = next
      .map((item) => item.orderKey)
      .filter((k): k is string => typeof k === "string");
    const locales = Object.fromEntries(
      getActiveLocaleIds().map((id) => [id, [...newOrder]]),
    );
    edit.applyArrayDraft(sectionOrderKey, locales);
  };
  drag.createDropHandler(handleReorder);
  const sidebarIdsKey = sidebar.map((item) => item.id).join("|");
  const [activeId, setActiveId] = useState<string>(sidebar[0]?.id ?? "");

  useEffect(() => {
    const ids = sidebarIdsKey.split("|").filter(Boolean);
    if (ids.length === 0) return;

    let frame = 0;
    const compute = () => {
      const offset = 140;
      let bestId = ids[0];
      let bestTop = -Infinity;
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top - offset;
        if (top <= 0 && top > bestTop) {
          bestId = id;
          bestTop = top;
        }
      }
      setActiveId(bestId);
    };

    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(compute);
    };

    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [sidebarIdsKey]);

  return (
    <article>
      <PageHeroBanner src={heroSrc} fallbackSrc={heroFallbackSrc} editKey={heroEditKey} />
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
                {reorderEnabled ? (
                  <div className="flex flex-col gap-4">
                    {fixedItem ? (
                      <LongFormNavLink
                        href={fixedItem.href}
                        label={fixedItem.label}
                        labelEditKey={fixedItem.labelEditKey}
                        active={activeId === fixedItem.id}
                      />
                    ) : null}
                    <EditReorderList className="flex flex-col gap-1">
                      {orderItems.map((item, i) => (
                        <Fragment key={item.id}>
                          <div className="py-0.5">
                            <EditAddPill
                              busy={sectionBusy}
                              label="추가"
                              onClick={() => {
                                if (!sectionOrderKey || !edit) return;
                                void edit.insertLongFormSection(
                                  sectionOrderKey,
                                  i,
                                );
                              }}
                            />
                          </div>
                          <EditReorderRow
                            index={i}
                            dragIndex={drag.dragIndex}
                            rowShift={drag.getRowShift(i)}
                            onDragStart={drag.beginDrag}
                            handleClassName="absolute -left-9 inset-y-0 z-10"
                            fullWidth
                            busy={sectionBusy}
                            controls={
                              <EditInlineControls
                                busy={sectionBusy}
                                onDelete={() => {
                                  if (!sectionOrderKey || !edit) return;
                                  void edit.removeLongFormSection(
                                    sectionOrderKey,
                                    i,
                                  );
                                }}
                              />
                            }
                          >
                            <LongFormNavLink
                              href={item.href}
                              label={item.label}
                              labelEditKey={item.labelEditKey}
                              active={activeId === item.id}
                            />
                          </EditReorderRow>
                        </Fragment>
                      ))}
                      <div className="py-0.5">
                        <EditAddPill
                          busy={sectionBusy}
                          label="추가"
                          onClick={() => {
                            if (!sectionOrderKey || !edit) return;
                            void edit.insertLongFormSection(
                              sectionOrderKey,
                              orderItems.length,
                            );
                          }}
                        />
                      </div>
                    </EditReorderList>
                  </div>
                ) : (
                  <ul className="flex flex-col gap-4">
                    {sidebar.map((item) => (
                      <li key={item.id}>
                        <LongFormNavLink
                          href={item.href}
                          label={item.label}
                          labelEditKey={item.labelEditKey}
                          active={activeId === item.id}
                        />
                      </li>
                    ))}
                  </ul>
                )}
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
