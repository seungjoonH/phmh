"use client";

// 상담사 개인 프로필 페이지
import { notFound } from "next/navigation";
import { EditableTherapistBlocks } from "@/components/edit/EditableTherapistBlocks";
import { EditableText } from "@/components/edit/EditableText";
import { TherapistPortraitMedia } from "@/components/therapists/TherapistPortraitMedia";
import { editImageAttrs } from "@/lib/edit/attrs";
import { isEditMode } from "@/lib/edit/env";
import { PageVisibilityGuard } from "@/components/site/PageVisibilityGuard";
import { Reveal } from "@/components/motion/Reveal";
import { PageHeroBanner } from "@/components/ui/PageHeroBanner";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { useTherapistEditText } from "@/lib/edit/use-therapist-edit-text";
import {
  therapistHeaderLinesArrayKey,
  therapistHeaderNameKey,
} from "@/lib/edit/therapist-edit-key";
import { EditableTherapistStringList } from "@/components/therapists/EditableTherapistStringList";
import { getTherapistBySlug, pickLocale } from "@/lib/therapists/load";
import { therapistProfilePageId } from "@/lib/site-pages";
import { isTherapistProfileHidden } from "@/lib/site-pages-visibility";
import { pageHeroes } from "@/lib/page-heroes";

type Props = {
  slug: string;
};

export function TherapistProfilePage({ slug }: Props) {
  const { locale } = useLocale();
  const therapist = getTherapistBySlug(slug);

  if (!therapist || isTherapistProfileHidden(slug)) {
    notFound();
  }

  const pageId = therapistProfilePageId(slug);
  const header = therapist.profile.header;
  const nameKey = therapistHeaderNameKey(slug);
  const portraitKey = `therapists.${slug}.portrait`;
  const name = useTherapistEditText(nameKey, pickLocale(header.name, locale));
  const lines = pickLocale(header.lines, locale);
  const edit = isEditMode();

  return (
    <PageVisibilityGuard pageId={pageId}>
      <article>
        <PageHeroBanner src={pageHeroes.therapists} editKey="heroes.therapists" />
        <div className="page-container">
          <Reveal>
            <div className="mx-auto max-w-3xl">
              <div
                className="relative mx-auto mb-10 aspect-[3/4] max-w-sm overflow-hidden rounded-t-full shadow-md"
                {...(edit ? editImageAttrs(portraitKey) : {})}
              >
                <TherapistPortraitMedia
                  slug={slug}
                  portraitSrc={therapist.profile.portrait}
                  defaultPortrait={therapist.profile.defaultPortrait}
                  sizes="(max-width: 768px) 80vw, 384px"
                  priority
                  editClipBounds
                />
              </div>
              <EditableText as="h1" className="page-title text-center" editKey={nameKey}>
                {name}
              </EditableText>
              <div className="page-title-rule mx-auto" />
              <EditableTherapistStringList
                arrayKey={therapistHeaderLinesArrayKey(slug)}
                items={lines}
                variant="profile-line"
              />
            </div>
          </Reveal>
          <div className="mx-auto mt-14 max-w-3xl">
            <EditableTherapistBlocks therapist={therapist} />
          </div>
        </div>
      </article>
    </PageVisibilityGuard>
  );
}
