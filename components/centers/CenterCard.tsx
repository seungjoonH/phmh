"use client";

// Center 목록 카드
import Link from "next/link";
import { CenterHeroMedia } from "@/components/centers/CenterHeroMedia";
import {
  type CenterImageDraftItem,
  useEditDraftOptional,
} from "@/components/edit/EditDraftProvider";
import { EditableText } from "@/components/edit/EditableText";
import type { CenterRecord } from "@/lib/centers/types";
import type { ContentLocale } from "@/lib/content-blocks/types";
import {
  getCenterContactDetails,
  getCenterContactEditKeys,
} from "@/lib/centers/contact";
import { pickCenterLocale } from "@/lib/centers/load";
import { editImageAttrs } from "@/lib/edit/attrs";
import {
  centerDefaultImageKey,
  centerNavLabelKey,
  centerPageKey,
} from "@/lib/edit/center-edit-key";
import { useCenterEditText } from "@/lib/edit/use-center-edit-text";
import { isEditMode } from "@/lib/edit/env";
import type { Messages } from "@/lib/i18n/messages";

type Props = {
  center: CenterRecord;
  locale: ContentLocale;
  messages: Messages;
  ctaLabel: string;
};

export function CenterCard({ center, locale, messages, ctaLabel }: Props) {
  const titleKey = centerNavLabelKey(center.slug);
  const summaryKey = centerPageKey(center.slug, "summary");
  const title = useCenterEditText(titleKey, pickCenterLocale(center.nav.label, locale));
  const summary = useCenterEditText(
    summaryKey,
    pickCenterLocale(center.page.summary, locale),
  );
  const alt = pickCenterLocale(center.imageAlt.hero, locale);
  const address = getCenterContactDetails(center.contactRef, messages).address;
  const addressKey = getCenterContactEditKeys(center.contactRef).address;
  const edit = isEditMode();
  const editCtx = useEditDraftOptional();
  const imageKey = centerDefaultImageKey(center.slug);
  const imageDraft = editCtx?.getCenterImagesDraft(center.slug);
  const cardImage: CenterImageDraftItem | undefined =
    imageDraft?.items[0] ?? center.gallery[0];

  const stopEditNavigate = (e: React.MouseEvent) => {
    if (!edit) return;
    const target = e.target as HTMLElement;
    if (target.closest("[data-phmh-edit], [data-phmh-key], button")) {
      e.preventDefault();
    }
  };

  return (
    <Link
      href={`/centers/${center.slug}`}
      onClick={stopEditNavigate}
      className="group block overflow-hidden rounded-lg border border-page-body/10 bg-page-bg shadow-sm transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-md"
    >
      <div
        className="relative aspect-[16/10] w-full bg-page-body/5"
        {...(edit ? editImageAttrs(imageKey) : {})}
      >
        <CenterHeroMedia
          src={cardImage?.previewUrl ?? cardImage?.src ?? center.hero}
          alt={alt}
          defaultHero={!cardImage}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="p-5">
        <EditableText
          as="h2"
          className="font-logo text-2xl text-page-heading"
          editKey={titleKey}
        >
          {title}
        </EditableText>
        {summary ? (
          <EditableText
            as="p"
            className="mt-3 text-sm leading-6 text-page-body"
            editKey={summaryKey}
          >
            {summary}
          </EditableText>
        ) : null}
        {address ? (
          <EditableText
            as="p"
            className="mt-4 text-sm leading-6 text-page-body/75"
            editKey={addressKey}
          >
            {address}
          </EditableText>
        ) : null}
        <span className="interactive-link mt-5 inline-flex text-sm font-medium text-secondary underline-offset-4 group-hover:underline">
          {ctaLabel}
        </span>
      </div>
    </Link>
  );
}
