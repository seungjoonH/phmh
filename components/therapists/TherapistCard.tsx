// 상담사 목록 카드
import Link from "next/link";
import { EditableImage } from "@/components/edit/EditableImage";
import { EditableText } from "@/components/edit/EditableText";
import { editImageAttrs } from "@/lib/edit/attrs";
import { isEditMode } from "@/lib/edit/env";
import type { ContentLocale } from "@/lib/content-blocks/types";
import { useTherapistEditText } from "@/lib/edit/use-therapist-edit-text";
import {
  therapistListBulletKey,
  therapistListKey,
} from "@/lib/edit/therapist-edit-key";
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

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-sm border border-page-body/10 bg-page-bg shadow-sm transition hover:border-secondary/30">
      <div
        className="relative aspect-[4/3] w-full bg-page-body/5"
        {...(edit ? editImageAttrs(portraitKey) : {})}
      >
        <EditableImage
          editKey={portraitKey}
          src={profile.portrait}
          alt=""
          fill
          className="object-cover object-top"
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
        <ul className="space-y-1 text-sm font-light leading-relaxed text-page-body">
          {bullets.map((item, i) => (
            <TherapistCardBullet
              key={`${slug}-bullet-${i}`}
              slug={slug}
              index={i}
              committed={item}
            />
          ))}
        </ul>
        <div className="mt-auto pt-2">
          <Link
            href={`/therapists/${slug}`}
            className="interactive-link inline-flex items-center gap-2 text-sm font-medium text-secondary underline-offset-4 hover:underline"
          >
            <EditableText as="span" editKey={therapistListKey(slug, "ctaLabel")}>
              {cta}
            </EditableText>
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </article>
  );
}

function TherapistCardBullet({
  slug,
  index,
  committed,
}: {
  slug: string;
  index: number;
  committed: string;
}) {
  const editKey = therapistListBulletKey(slug, index);
  const text = useTherapistEditText(editKey, committed);
  return (
    <li className="flex gap-2">
      <span className="text-secondary" aria-hidden>
        –
      </span>
      <EditableText as="span" editKey={editKey}>
        {text}
      </EditableText>
    </li>
  );
}
