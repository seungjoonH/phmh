"use client";

// 상담사 개인 프로필 페이지
import { notFound } from "next/navigation";
import { EditableTherapistBlocks } from "@/components/edit/EditableTherapistBlocks";
import { EditableImage } from "@/components/edit/EditableImage";
import { EditableText } from "@/components/edit/EditableText";
import { editImageAttrs } from "@/lib/edit/attrs";
import { isEditMode } from "@/lib/edit/env";
import { PageVisibilityGuard } from "@/components/site/PageVisibilityGuard";
import { Reveal } from "@/components/motion/Reveal";
import { PageHeroBanner } from "@/components/ui/PageHeroBanner";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { useTherapistEditText } from "@/lib/edit/use-therapist-edit-text";
import {
  therapistHeaderLineKey,
  therapistHeaderNameKey,
} from "@/lib/edit/therapist-edit-key";
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
                className="relative mx-auto mb-10 aspect-[3/4] max-w-sm overflow-hidden rounded-sm shadow-md"
                {...(edit ? editImageAttrs(portraitKey) : {})}
              >
                <EditableImage
                  editKey={portraitKey}
                  src={therapist.profile.portrait}
                  alt=""
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 768px) 80vw, 384px"
                  priority
                  editClipBounds
                />
              </div>
              <EditableText as="h1" className="page-title text-center" editKey={nameKey}>
                {name}
              </EditableText>
              <div className="page-title-rule mx-auto" />
              <ul className="mt-6 space-y-1 text-center font-body text-base font-medium text-secondary/90">
                {lines.map((line, i) => (
                  <TherapistHeaderLine
                    key={`${slug}-line-${i}`}
                    slug={slug}
                    index={i}
                    committed={line}
                  />
                ))}
              </ul>
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

function TherapistHeaderLine({
  slug,
  index,
  committed,
}: {
  slug: string;
  index: number;
  committed: string;
}) {
  const editKey = therapistHeaderLineKey(slug, index);
  const text = useTherapistEditText(editKey, committed);
  return (
    <li>
      <EditableText as="span" editKey={editKey}>
        {text}
      </EditableText>
    </li>
  );
}
