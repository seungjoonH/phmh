"use client";

// 상담사 목록 그리드 — 편집 모드에서 카드 DnD·추가·삭제
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { EditAddPill } from "@/components/edit/EditAddPill";
import { useEditDraftOptional } from "@/components/edit/EditDraftProvider";
import { EditInlineControls } from "@/components/edit/EditInlineControls";
import { EditReorderList } from "@/components/edit/EditReorderList";
import { EditReorderRow } from "@/components/edit/EditReorderRow";
import { useEditReorderDrag } from "@/components/edit/useEditReorderDrag";
import { Reveal } from "@/components/motion/Reveal";
import { AddTherapistModal } from "@/components/therapists/AddTherapistModal";
import { TherapistCard } from "@/components/therapists/TherapistCard";
import type { ContentLocale } from "@/lib/content-blocks/types";
import { createTherapist, deleteTherapist } from "@/lib/edit/client";
import { isEditMode } from "@/lib/edit/env";
import type { TherapistRecord } from "@/lib/therapists/types";
import { confirm as showConfirm, showAlert } from "@/components/ui/AppDialog";

type Props = {
  therapists: TherapistRecord[];
  locale: ContentLocale;
};

export function TherapistsListGrid({ therapists, locale }: Props) {
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

  // draft therapist 순서를 prop 위에 오버레이 — SitePagesPanel 의 변경이 그리드에
  // 실시간 반영되고, 그리드에서의 변경도 같은 draft 를 쓰니까 사이드바에 즉시 반영된다.
  const orderedTherapists = useMemo(() => {
    const draftOrder = draft?.sitePagesTherapistOrderDraft;
    if (!draftOrder || draftOrder.length === 0) return therapists;
    const bySlug = new Map(therapists.map((t) => [t.slug, t]));
    const seen = new Set<string>();
    const out: TherapistRecord[] = [];
    for (const slug of draftOrder) {
      const t = bySlug.get(slug);
      if (t && !seen.has(slug)) {
        seen.add(slug);
        out.push(t);
      }
    }
    for (const t of therapists) {
      if (!seen.has(t.slug)) out.push(t);
    }
    return out;
  }, [therapists, draft?.sitePagesTherapistOrderDraft]);

  const handleAddSubmit = async (name: string) => {
    setBusy(true);
    setAddError(null);
    try {
      const { slug } = await createTherapist(name);
      setAddOpen(false);
      router.refresh();
      router.push(`/therapists/${slug}`);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "추가 실패");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (slug: string, displayName: string) => {
    if (
      !(await showConfirm({
        message: `${displayName} 상담사를 삭제할까요?`,
        danger: true,
      }))
    )
      return;
    setBusy(true);
    try {
      await deleteTherapist(slug);
      router.refresh();
    } catch (err) {
      await showAlert(err instanceof Error ? err.message : "삭제 실패");
    } finally {
      setBusy(false);
    }
  };

  if (!edit) {
    return (
      <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {orderedTherapists.map((therapist, i) => (
          <Reveal key={therapist.slug} delay={i * 0.05}>
            <TherapistCard therapist={therapist} locale={locale} />
          </Reveal>
        ))}
      </div>
    );
  }

  createDropHandler((from, insertAt) => {
    const order = orderedTherapists.map((t) => t.slug);
    const [moved] = order.splice(from, 1);
    const target = insertAt > from ? insertAt - 1 : insertAt;
    order.splice(target, 0, moved);
    // 사이드바와 동일한 draft 채널을 통해 순서 변경 — toolbar save 시 persist 됨.
    draft?.setSitePagesTherapistOrderDraft(order);
  });

  return (
    <div className="mt-12">
      <EditReorderList className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {orderedTherapists.map((therapist, i) => (
          <div key={therapist.slug}>
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
                    void handleDelete(therapist.slug, therapist.list.name.en)
                  }
                />
              }
            >
              <TherapistCard therapist={therapist} locale={locale} />
            </EditReorderRow>
          </div>
        ))}
      </EditReorderList>
      <div className="mt-8">
        <EditAddPill
          busy={busy}
          label="상담사 추가"
          onClick={() => {
            setAddError(null);
            setAddOpen(true);
          }}
        />
      </div>
      <AddTherapistModal
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
