"use client";

// Center 목록 페이지
import { CentersListGrid } from "@/components/centers/CentersListGrid";
import { EditableText } from "@/components/edit/EditableText";
import { Reveal } from "@/components/motion/Reveal";
import { PageVisibilityGuard } from "@/components/site/PageVisibilityGuard";
import { PageHeroBanner } from "@/components/ui/PageHeroBanner";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { useVisibilityEpoch } from "@/lib/edit/use-visibility-epoch";
import { getVisibleCenters } from "@/lib/centers/load";
import { pageHeroes } from "@/lib/page-heroes";

const LIST_PREFIX = "centers.list";

export function CentersListPage() {
  const { locale, messages } = useLocale();
  useVisibilityEpoch();
  const centers = getVisibleCenters();
  const shell = messages.centers.list;

  return (
    <PageVisibilityGuard pageId="centers.list">
      <article>
        <PageHeroBanner src={pageHeroes.centers} editKey="heroes.centers" />
        <div className="page-container">
          <Reveal>
            <EditableText as="h1" className="page-title" editKey={`${LIST_PREFIX}.pageTitle`}>
              {shell.pageTitle}
            </EditableText>
            <div className="page-title-rule" />
            {shell.intro ? (
              <EditableText
                as="p"
                className="mx-auto mt-8 max-w-2xl text-center text-lg font-light leading-8 text-page-body"
                editKey={`${LIST_PREFIX}.intro`}
              >
                {shell.intro}
              </EditableText>
            ) : null}
          </Reveal>
          <CentersListGrid
            centers={centers}
            locale={locale}
            messages={messages}
            ctaLabel={shell.viewCenter}
          />
        </div>
      </article>
    </PageVisibilityGuard>
  );
}
