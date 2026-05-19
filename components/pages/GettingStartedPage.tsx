"use client";

import { Reveal } from "@/components/motion/Reveal";
import { RevealStagger, RevealStaggerItem } from "@/components/motion/RevealStagger";
import { EditableText } from "@/components/edit/EditableText";
import { PageHeroBanner } from "@/components/ui/PageHeroBanner";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { pageHeroes } from "@/lib/page-heroes";

const EDIT_PREFIX = "pages.gettingStarted";

export function GettingStartedPage() {
  const { messages } = useLocale();
  const data = messages.pages.gettingStarted;

  return (
    <article>
      <PageHeroBanner src={pageHeroes.gettingStarted} editKey="heroes.gettingStarted" priority />
      <div className="page-container">
        <Reveal>
          <EditableText as="h1" className="page-title" editKey={`${EDIT_PREFIX}.title`}>
            {data.title}
          </EditableText>
          <div className="page-title-rule" />
        </Reveal>
        <RevealStagger className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-y-14">
          {data.steps.map((step, index) => (
            <RevealStaggerItem
              key={step.number}
              className="flex min-h-[8.5rem] flex-col text-left"
            >
              <p className="text-sm font-bold tracking-wide text-secondary">
                Step {step.number}
              </p>
              <EditableText
                as="p"
                className="mt-2 font-logo text-xl text-page-heading md:text-2xl"
                editKey={`${EDIT_PREFIX}.steps.${index}.title`}
              >
                {step.title}
              </EditableText>
              <div
                className="my-4 h-0.5 w-10 shrink-0 bg-page-heading/40"
                aria-hidden
              />
              <EditableText
                as="p"
                className="text-sm leading-relaxed text-page-body/80 md:text-base"
                editKey={`${EDIT_PREFIX}.steps.${index}.description`}
              >
                {step.description}
              </EditableText>
            </RevealStaggerItem>
          ))}
        </RevealStagger>
      </div>
    </article>
  );
}
