"use client";

// 상담사 목록 그리드 — 편집 모드에서 카드 DnD·추가·삭제
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { EditAddLink } from "@/components/edit/EditAddLink";
import { EditInlineControls } from "@/components/edit/EditInlineControls";
import { EditReorderList } from "@/components/edit/EditReorderList";
import { EditReorderRow } from "@/components/edit/EditReorderRow";
import { useEditReorderDrag } from "@/components/edit/useEditReorderDrag";
import { Reveal } from "@/components/motion/Reveal";
import { AddTherapistModal } from "@/components/therapists/AddTherapistModal";
import { TherapistCard } from "@/components/therapists/TherapistCard";
import type { ContentLocale } from "@/lib/content-blocks/types";
import {
  createTherapist,
  deleteTherapist,
  patchTherapistsOrder,
} from "@/lib/edit/client";
import { isEditMode } from "@/lib/edit/env";
import type { TherapistRecord } from "@/lib/therapists/types";

type Props = {
  therapists: TherapistRecord[];
  locale: ContentLocale;
};

export function TherapistsListGrid({ therapists, locale }: Props) {
  const router = useRouter();
  const edit = isEditMode();
  const [busy, setBusy] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const {
    dragIndex,
    dropTarget,
    setDragIndex,
    pickDropTarget,
    createDropHandler,
  } = useEditReorderDrag({ axis: "x" });

  const persistOrder = useCallback(
    async (order: string[]) => {
      setBusy(true);
      try {
        await patchTherapistsOrder(order);
        router.refresh();
      } finally {
        setBusy(false);
      }
    },
    [router],
  );

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
    if (!window.confirm(`${displayName} 상담사를 삭제할까요?`)) return;
    setBusy(true);
    try {
      await deleteTherapist(slug);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "삭제 실패");
    } finally {
      setBusy(false);
    }
  };

  if (!edit) {
    return (
      <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {therapists.map((therapist, i) => (
          <Reveal key={therapist.slug} delay={i * 0.05}>
            <TherapistCard therapist={therapist} locale={locale} />
          </Reveal>
        ))}
      </div>
    );
  }

  const handleDrop = createDropHandler((from, insertAt) => {
    const order = therapists.map((t) => t.slug);
    const [moved] = order.splice(from, 1);
    const target = insertAt > from ? insertAt - 1 : insertAt;
    order.splice(target, 0, moved);
    void persistOrder(order);
  });

  return (
    <div className="mt-12">
      <EditReorderList
        layout="grid"
        dragIndex={dragIndex}
        pickDropTarget={pickDropTarget}
        onDrop={handleDrop}
        className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
      >
        {therapists.map((therapist, i) => (
          <EditReorderRow
            key={therapist.slug}
            index={i}
            dragIndex={dragIndex}
            dropTarget={dropTarget}
            busy={busy}
            orientation="horizontal"
            className="w-full"
            handleClassName="absolute left-2 top-2 z-10"
            onDragStart={setDragIndex}
            onDropTarget={pickDropTarget}
            onDrop={handleDrop}
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
        ))}
      </EditReorderList>
      <div className="mt-6">
        <EditAddLink
          disabled={busy}
          onClick={() => {
            setAddError(null);
            setAddOpen(true);
          }}
          className="text-sm"
        >
          + 상담사 추가
        </EditAddLink>
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
