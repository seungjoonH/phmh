"use client";

// 상담사 목록 페이지
import { PageVisibilityGuard } from "@/components/site/PageVisibilityGuard";
import { TherapistsListGrid } from "@/components/therapists/TherapistsListGrid";
import { Reveal } from "@/components/motion/Reveal";
import { EditableText } from "@/components/edit/EditableText";
import { PageHeroBanner } from "@/components/ui/PageHeroBanner";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { useVisibilityEpoch } from "@/lib/edit/use-visibility-epoch";
import { getVisibleTherapists } from "@/lib/therapists/load";
import { pageHeroes } from "@/lib/page-heroes";

const LIST_PREFIX = "therapists.list";

export function TherapistsListPage() {
  const { locale, messages } = useLocale();
  const shell = messages.therapists.list;
  // 편집 모드 사이드바에서 숨김/순서 draft 가 바뀌면 runtime overlay 가 갱신되고
  // `phmh-edit-visibility-changed` 이벤트가 발사되니, epoch 을 구독해 리렌더한다.
  useVisibilityEpoch();
  const therapists = getVisibleTherapists();

  return (
    <PageVisibilityGuard pageId="therapists.list">
      <article>
        <PageHeroBanner src={pageHeroes.therapists} editKey="heroes.therapists" />
        <div className="page-container">
          <Reveal>
            <EditableText as="h1" className="page-title" editKey={`${LIST_PREFIX}.pageTitle`}>
              {shell.pageTitle}
            </EditableText>
            <div className="page-title-rule" />
          </Reveal>
          <TherapistsListGrid therapists={therapists} locale={locale} />
        </div>
      </article>
    </PageVisibilityGuard>
  );
}
