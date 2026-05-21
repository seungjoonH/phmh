"use client";

// 상담사 목록 카드 — 클릭 시 프로필 이동, 편집 영역 클릭은 예외
import Link from "next/link";
import { EditableText } from "@/components/edit/EditableText";
import { TherapistPortraitMedia } from "@/components/therapists/TherapistPortraitMedia";
import { editImageAttrs } from "@/lib/edit/attrs";
import { isEditMode } from "@/lib/edit/env";
import type { ContentLocale } from "@/lib/content-blocks/types";
import { useTherapistEditText } from "@/lib/edit/use-therapist-edit-text";
import {
  therapistListBulletsArrayKey,
  therapistListKey,
} from "@/lib/edit/therapist-edit-key";
import { EditableTherapistStringList } from "@/components/therapists/EditableTherapistStringList";
import { pickLocale } from "@/lib/therapists/load";
import type { TherapistRecord } from "@/lib/therapists/types";

type Props = {
  therapist: TherapistRecord;
  locale: ContentLocale;
};

export function TherapistCard({ therapist, locale }: Props) {
  const { list, profile, slug } = therapist;
  const name = useTherapistEditText(
    therapistListKey(slug, "name"),
    pickLocale(list.name, locale),
  );
  const subtitleRaw = useTherapistEditText(
    therapistListKey(slug, "subtitle"),
    pickLocale(list.subtitle, locale),
  );
  const bullets = pickLocale(list.bullets, locale);
  const cta = useTherapistEditText(
    therapistListKey(slug, "ctaLabel"),
    pickLocale(list.ctaLabel, locale),
  );
  const portraitKey = `therapists.${slug}.portrait`;
  const edit = isEditMode();
  const profileHref = `/therapists/${slug}`;

  const stopEditNavigate = (e: React.MouseEvent) => {
    if (!edit) return;
    const target = e.target as HTMLElement;
    if (target.closest("[data-phmh-edit], [data-phmh-key], button")) {
      e.preventDefault();
    }
  };

  return (
    <Link
      href={profileHref}
      onClick={stopEditNavigate}
      className="group/card flex h-full flex-col overflow-hidden rounded-sm border border-page-body/10 bg-page-bg shadow-sm transition hover:border-secondary/30"
    >
      <div
        className="relative z-0 aspect-[3/4] w-full bg-page-body/5"
        {...(edit ? editImageAttrs(portraitKey) : {})}
      >
        <TherapistPortraitMedia
          slug={slug}
          portraitSrc={profile.portrait}
          defaultPortrait={profile.defaultPortrait}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          editClipBounds
        />
      </div>
      <div className="flex flex-1 flex-col gap-4 p-6">
        <div>
          <EditableText
            as="h2"
            className="font-display text-xl font-medium text-page-title"
            editKey={therapistListKey(slug, "name")}
          >
            {name}
          </EditableText>
          <EditableText
            as="p"
            className="mt-1 whitespace-pre-line text-sm font-medium text-secondary/90"
            editKey={therapistListKey(slug, "subtitle")}
          >
            {subtitleRaw}
          </EditableText>
        </div>
        <EditableTherapistStringList
          arrayKey={therapistListBulletsArrayKey(slug)}
          items={bullets}
          variant="card-bullet"
        />
        <div className="mt-auto pt-2">
          <span className="interactive-link inline-flex items-center gap-2 text-sm font-medium text-secondary underline-offset-4 group-hover/card:underline">
            <EditableText as="span" editKey={therapistListKey(slug, "ctaLabel")}>
              {cta}
            </EditableText>
            <span aria-hidden>→</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
