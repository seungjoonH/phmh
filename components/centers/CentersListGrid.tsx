"use client";

// Center 목록 그리드 — 편집 모드에서 카드 DnD·추가·삭제
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AddCenterModal } from "@/components/centers/AddCenterModal";
import { CenterCard } from "@/components/centers/CenterCard";
import { EditAddPill } from "@/components/edit/EditAddPill";
import { useEditDraftOptional } from "@/components/edit/EditDraftProvider";
import { EditInlineControls } from "@/components/edit/EditInlineControls";
import { EditReorderList } from "@/components/edit/EditReorderList";
import { EditReorderRow } from "@/components/edit/EditReorderRow";
import { useEditReorderDrag } from "@/components/edit/useEditReorderDrag";
import { Reveal } from "@/components/motion/Reveal";
import { confirm as showConfirm, showAlert } from "@/components/ui/AppDialog";
import type { ContentLocale } from "@/lib/content-blocks/types";
import { createCenter, deleteCenter } from "@/lib/edit/client";
import { isEditMode } from "@/lib/edit/env";
import type { Messages } from "@/lib/i18n/messages";
import type { CenterRecord } from "@/lib/centers/types";
import { pickCenterLocale } from "@/lib/centers/load";

type Props = {
  centers: CenterRecord[];
  locale: ContentLocale;
  messages: Messages;
  ctaLabel: string;
};

export function CentersListGrid({ centers, locale, messages, ctaLabel }: Props) {
  const router = useRouter();
  const edit = isEditMode();
  const draft = useEditDraftOptional();
  const [busy, setBusy] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const {
    dragIndex,
    dropTarget,
    beginDrag,
    createDropHandler,
    getRowShift,
  } = useEditReorderDrag({ axis: "x" });

  const orderedCenters = useMemo(() => {
    const draftOrder = draft?.sitePagesCenterOrderDraft;
    if (!draftOrder || draftOrder.length === 0) return centers;
    const bySlug = new Map(centers.map((center) => [center.slug, center]));
    const seen = new Set<string>();
    const out: CenterRecord[] = [];
    for (const slug of draftOrder) {
      const center = bySlug.get(slug);
      if (center && !seen.has(slug)) {
        seen.add(slug);
        out.push(center);
      }
    }
    for (const center of centers) {
      if (!seen.has(center.slug)) out.push(center);
    }
    return out;
  }, [centers, draft?.sitePagesCenterOrderDraft]);

  const handleAddSubmit = async (name: string) => {
    setBusy(true);
    setAddError(null);
    try {
      const { slug } = await createCenter(name);
      setAddOpen(false);
      router.refresh();
      router.push(`/centers/${slug}`);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "추가 실패");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (slug: string, displayName: string) => {
    if (
      !(await showConfirm({
        message: `${displayName} Center를 삭제할까요?`,
        danger: true,
      }))
    )
      return;
    setBusy(true);
    try {
      await deleteCenter(slug);
      router.refresh();
    } catch (err) {
      await showAlert(err instanceof Error ? err.message : "삭제 실패");
    } finally {
      setBusy(false);
    }
  };

  if (!edit) {
    return (
      <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {orderedCenters.map((center, i) => (
          <Reveal key={center.slug} delay={i * 0.05}>
            <CenterCard
              center={center}
              locale={locale}
              messages={messages}
              ctaLabel={ctaLabel}
            />
          </Reveal>
        ))}
      </div>
    );
  }

  createDropHandler((from, insertAt) => {
    const order = orderedCenters.map((center) => center.slug);
    const [moved] = order.splice(from, 1);
    const target = insertAt > from ? insertAt - 1 : insertAt;
    order.splice(target, 0, moved);
    draft?.setSitePagesCenterOrderDraft(order);
  });

  return (
    <div className="mt-12">
      <EditReorderList className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {orderedCenters.map((center, i) => (
          <div key={center.slug}>
            <EditReorderRow
              index={i}
              dragIndex={dragIndex}
              dropTarget={dropTarget}
              rowShift={getRowShift(i)}
              busy={busy}
              orientation="horizontal"
              className="w-full"
              handleClassName="absolute -left-2 top-2 z-[70] !border-page-body/40 !bg-page-bg !text-page-heading shadow-md ring-1 ring-page-body/15 hover:!border-page-body/60 hover:!bg-page-bg"
              onDragStart={beginDrag}
              controls={
                <EditInlineControls
                  busy={busy}
                  onDelete={() =>
                    void handleDelete(
                      center.slug,
                      pickCenterLocale(center.nav.label, locale),
                    )
                  }
                />
              }
            >
              <CenterCard
                center={center}
                locale={locale}
                messages={messages}
                ctaLabel={ctaLabel}
              />
            </EditReorderRow>
          </div>
        ))}
      </EditReorderList>
      <div className="mt-8">
        <EditAddPill
          busy={busy}
          label="Center 추가"
          onClick={() => {
            setAddError(null);
            setAddOpen(true);
          }}
        />
      </div>
      <AddCenterModal
        open={addOpen}
        busy={busy}
        error={addError}
        onClose={() => {
          if (!busy) setAddOpen(false);
        }}
        onSubmit={(name) => void handleAddSubmit(name)}
      />
    </div>
  );
}
