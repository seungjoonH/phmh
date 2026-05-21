"use client";

// Center 상세 페이지
import { notFound } from "next/navigation";
import { CenterContactDetails } from "@/components/centers/CenterContactDetails";
import { CenterGalleryCarousel } from "@/components/centers/CenterGalleryCarousel";
import { ContentBlockStream } from "@/components/content/ContentBlockStream";
import { EditableText } from "@/components/edit/EditableText";
import { Reveal } from "@/components/motion/Reveal";
import { PageVisibilityGuard } from "@/components/site/PageVisibilityGuard";
import { PageHeroBanner } from "@/components/ui/PageHeroBanner";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { getCenterBySlug, pickCenterLocale } from "@/lib/centers/load";
import { getCenterMapEmbedSrc } from "@/lib/centers/map";
import { pageHeroes } from "@/lib/page-heroes";
import {
  centerBlockListItemKey,
  centerBlockTextKey,
  centerNavLabelKey,
  centerPageKey,
} from "@/lib/edit/center-edit-key";
import { centerProfilePageId } from "@/lib/site-pages";
import { isCenterProfileHidden } from "@/lib/site-pages-visibility";

type Props = {
  slug: string;
};

export function CenterProfilePage({ slug }: Props) {
  const { locale, messages } = useLocale();
  const center = getCenterBySlug(slug);

  if (!center || isCenterProfileHidden(slug)) {
    notFound();
  }

  const pageId = centerProfilePageId(slug);
  const eyebrow = pickCenterLocale(center.page.eyebrow, locale);
  const title = pickCenterLocale(center.page.title, locale);
  const summary = pickCenterLocale(center.page.summary, locale);
  const heroAlt = pickCenterLocale(center.imageAlt.hero, locale);
  const mapSrc = getCenterMapEmbedSrc(center.mapRef, messages);

  return (
    <PageVisibilityGuard pageId={pageId}>
      <article>
        <PageHeroBanner
          src={pageHeroes.centers}
          alt={heroAlt}
          editKey="heroes.centers"
        />
        <div className="page-container">
          <Reveal>
            <div className="text-center">
              {eyebrow ? (
                <EditableText
                  as="p"
                  className="font-body text-sm font-semibold uppercase tracking-wide text-secondary"
                  editKey={centerPageKey(center.slug, "eyebrow")}
                >
                  {eyebrow}
                </EditableText>
              ) : null}
              <EditableText
                as="h1"
                className="page-title mt-2"
                editKey={centerNavLabelKey(center.slug)}
              >
                {title}
              </EditableText>
              <div className="page-title-rule" />
              {summary ? (
                <EditableText
                  as="p"
                  className="mx-auto mt-8 max-w-2xl text-lg font-light leading-8 text-page-body"
                  editKey={centerPageKey(center.slug, "summary")}
                >
                  {summary}
                </EditableText>
              ) : null}
            </div>
          </Reveal>

          <div className="mt-12">
            <CenterGalleryCarousel center={center} locale={locale} />
          </div>

          <div className="mx-auto mt-16 grid max-w-5xl gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,5fr)]">
            <Reveal>
              <CenterContactDetails center={center} locale={locale} messages={messages} />
            </Reveal>
            {mapSrc ? (
              <Reveal delay={0.06}>
                <iframe
                  src={mapSrc}
                  title={`${title} location map`}
                  className="aspect-[16/9] w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </Reveal>
            ) : null}
          </div>

          {center.blocks.length > 0 ? (
            <div className="mx-auto mt-16 max-w-3xl">
              <ContentBlockStream
                blocks={center.blocks}
                locale={locale}
                editKeyForBlockText={(blockId) =>
                  centerBlockTextKey(center.slug, blockId)
                }
                editKeyForListItem={(blockId, index) =>
                  centerBlockListItemKey(center.slug, blockId, index)
                }
              />
            </div>
          ) : null}
        </div>
      </article>
    </PageVisibilityGuard>
  );
}
