"use client";

// 편집 모드 — 설정 언어 순서·숨김·추가 (저장 전까지 미리보기)
import Image from "next/image";
import { useMemo, useState } from "react";
import { EditReorderList } from "@/components/edit/EditReorderList";
import { EditReorderRow } from "@/components/edit/EditReorderRow";
import { useEditReorderDrag } from "@/components/edit/useEditReorderDrag";
import { LocalePickerModal } from "@/components/settings/LocalePickerModal";
import { useEditDraft } from "@/components/edit/EditDraftProvider";
import {
  getAddableLocaleOptions,
  getLocaleManifest,
  getOrderedLocaleOptions,
} from "@/lib/site-locales";

type Props = {
  selectedLocale: string;
  onSelectLocale: (id: string) => void;
};

export function EditLanguageSettings({ selectedLocale, onSelectLocale }: Props) {
  const {
    committing,
    localeCreateBusy,
    localeManifestDraft,
    applyLocaleManifestDraft,
    createLocaleWithFiles,
  } = useEditDraft();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const {
    dragIndex,
    dropTarget,
    setDragIndex,
    pickDropTarget,
    createDropHandler,
  } = useEditReorderDrag({ axis: "x" });

  const manifest = localeManifestDraft ?? getLocaleManifest();

  const ordered = useMemo(() => {
    return getOrderedLocaleOptions().filter((opt) => manifest.order.includes(opt.id));
  }, [manifest]);

  const addable = getAddableLocaleOptions();

  const busy = committing || localeCreateBusy;

  const toggleHidden = (id: string) => {
    const hidden = new Set(manifest.hidden);
    if (hidden.has(id)) hidden.delete(id);
    else hidden.add(id);
    applyLocaleManifestDraft({ ...manifest, hidden: [...hidden] });
  };

  const handleDrop = createDropHandler((from, insertAt) => {
    const order = [...manifest.order];
    const [item] = order.splice(from, 1);
    order.splice(insertAt, 0, item);
    applyLocaleManifestDraft({ ...manifest, order });
  });

  const handleAdd = async (id: string) => {
    setPickerOpen(false);
    setAddError(null);
    try {
      await createLocaleWithFiles(id);
      onSelectLocale(id);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div>
      <p className="mb-3 text-sm font-medium text-page-heading">Language</p>
      <EditReorderList
        axis="x"
        dragIndex={dragIndex}
        pickDropTarget={pickDropTarget}
        onDrop={handleDrop}
        className="flex flex-wrap gap-3"
      >
        {ordered.map((opt, index) => {
          const isHidden = manifest.hidden.includes(opt.id);
          return (
            <EditReorderRow
              key={opt.id}
              index={index}
              dragIndex={dragIndex}
              dropTarget={dropTarget}
              busy={busy}
              orientation="horizontal"
              className="min-w-[5.5rem] flex-1"
              handleClassName="absolute -left-2 top-1 z-10"
              onDragStart={setDragIndex}
              onDropTarget={pickDropTarget}
              onDrop={handleDrop}
            >
              <div
                className={`flex flex-col items-center gap-1.5 rounded-lg border px-2 py-2 text-center ${
                  isHidden ? "border-page-body/10 opacity-50" : "border-page-body/20"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelectLocale(opt.id)}
                  className={`interactive-button flex h-10 w-10 shrink-0 items-center justify-center rounded border-2 ${
                    selectedLocale === opt.id ? "border-secondary" : "border-transparent"
                  }`}
                  aria-label={opt.label}
                  aria-pressed={selectedLocale === opt.id}
                >
                  <Image src={opt.flagSrc} alt="" width={32} height={20} className="h-5 w-8" />
                </button>
                <span className="w-full truncate text-xs text-page-body">{opt.label}</span>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => toggleHidden(opt.id)}
                  className="interactive-button rounded px-1.5 py-0.5 text-xs text-page-body hover:bg-page-body/10 disabled:opacity-30"
                  aria-label={isHidden ? `${opt.label} 표시` : `${opt.label} 숨기기`}
                >
                  {isHidden ? "표시" : "숨김"}
                </button>
              </div>
            </EditReorderRow>
          );
        })}
      </EditReorderList>
      {addError ? (
        <p className="mt-2 text-xs text-red-500" role="alert">
          {addError}
        </p>
      ) : null}
      <button
        type="button"
        disabled={busy || addable.length === 0}
        onClick={() => setPickerOpen(true)}
        className="interactive-link mt-4 block text-sm text-secondary disabled:opacity-50"
      >
        + 언어 추가
      </button>
      <LocalePickerModal
        open={pickerOpen}
        options={addable}
        onClose={() => setPickerOpen(false)}
        onSelect={handleAdd}
      />
    </div>
  );
}
