"use client";

import { PageVisibilityGuard } from "@/components/site/PageVisibilityGuard";
import { Reveal } from "@/components/motion/Reveal";
import { EditableGettingStartedSteps } from "@/components/edit/EditableGettingStartedSteps";
import { EditableText } from "@/components/edit/EditableText";
import { PageHeroBanner } from "@/components/ui/PageHeroBanner";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { pageHeroes } from "@/lib/page-heroes";

const EDIT_PREFIX = "pages.gettingStarted";
const STEPS_KEY = `${EDIT_PREFIX}.steps`;

export function GettingStartedPage() {
  const { messages } = useLocale();
  const data = messages.pages.gettingStarted;

  return (
    <PageVisibilityGuard pageId="getting-started">
    <article>
      <PageHeroBanner src={pageHeroes.gettingStarted} editKey="heroes.gettingStarted" priority />
      <div className="page-container">
        <Reveal>
          <EditableText as="h1" className="page-title" editKey={`${EDIT_PREFIX}.title`}>
            {data.title}
          </EditableText>
          <div className="page-title-rule" />
        </Reveal>
        <EditableGettingStartedSteps arrayKey={STEPS_KEY} steps={data.steps} />
      </div>
    </article>
    </PageVisibilityGuard>
  );
}
