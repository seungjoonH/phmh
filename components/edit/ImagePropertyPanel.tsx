"use client";

// 이미지 교체 패널 — 미리보기 후 저장 시 public/ 반영
import { useCallback, useEffect, useState } from "react";
import { useEditDraft } from "@/components/edit/EditDraftProvider";
import { EditSidePanel } from "@/components/edit/EditSidePanel";
import { fetchImageRegistry } from "@/lib/edit/client";
import { getImageRegistryEntry } from "@/lib/edit/image-registry";

export function ImagePropertyPanel() {
  const {
    selected,
    closeEditor,
    imageDrafts,
    setImageDraft,
    commitImageKey,
    committing,
  } = useEditDraft();

  const key = selected?.kind === "image" ? selected.key : null;
  const entry = key ? getImageRegistryEntry(key) : undefined;

  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasChange, setHasChange] = useState(false);

  useEffect(() => {
    if (!key || !entry) return;
    let cancelled = false;
    setPreviewUrl("");
    setLoading(true);
    setError(null);
    const existing = imageDrafts[key];
    if (existing) {
      setPreviewUrl(existing.previewUrl);
      setPendingFile(existing.file);
      setHasChange(true);
      setLoading(false);
      return;
    }

    fetchImageRegistry(key)
      .then((data) => {
        if (cancelled) return;
        setPreviewUrl(`${data.publicPath}?v=${Date.now()}`);
        setPendingFile(null);
        setHasChange(false);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [key, entry, imageDrafts]);

  const applyFile = useCallback(
    (file: File) => {
      if (!key) return;
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setPendingFile(file);
      setHasChange(true);
      setImageDraft(key, { previewUrl: url, file });
    },
    [key, setImageDraft],
  );

  const handleClose = () => {
    closeEditor();
  };

  const handleApply = async () => {
    if (!key || committing) return;
    try {
      await commitImageKey(key);
      closeEditor();
    } catch {
      /* alert in commitImageKey */
    }
  };

  if (!key || !entry) return null;

  return (
    <EditSidePanel>
      <div className="flex min-h-0 flex-1 flex-col p-5">
        <div className="mb-3 flex shrink-0 items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-page-body/70">
              이미지 편집
            </p>
            <p className="mt-1 break-all font-mono text-xs text-page-body">{key}</p>
            <p className="mt-1 text-xs text-page-body/70">{entry.file}</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded p-1 text-page-body hover:bg-page-body/10"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-page-body">불러오는 중…</p>
        ) : (
          <div className="phmh-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain">
            <div className="rounded border border-page-body/15 bg-page-body/5 p-4">
              {previewUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={previewUrl}
                  alt=""
                  className="mx-auto max-h-32 w-auto object-contain"
                />
              ) : (
                <p className="text-center text-sm text-page-body/60">미리보기 없음</p>
              )}
            </div>
            <label className="block cursor-pointer">
              <span className="mb-2 block text-sm font-medium text-page-heading">
                새 이미지 파일
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <span className="input-file-trigger">파일 선택</span>
                <span className="min-w-0 truncate text-sm text-page-body/60">
                  {pendingFile?.name ?? "선택된 파일 없음"}
                </span>
              </div>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) applyFile(file);
                }}
              />
            </label>
          </div>
        )}

        {error ? <p className="mt-3 shrink-0 text-sm text-red-600">{error}</p> : null}
        <div className="mt-4 flex shrink-0 justify-end gap-2 border-t border-page-body/10 pt-4">
          <button
            type="button"
            onClick={handleClose}
            className="rounded px-4 py-2 text-sm text-page-body hover:bg-page-body/10"
            disabled={committing}
          >
            닫기
          </button>
          <button
            type="button"
            onClick={() => void handleApply()}
            className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            disabled={loading || committing || !hasChange || !pendingFile}
          >
            {committing ? "저장 중…" : "적용"}
          </button>
        </div>
      </div>
    </EditSidePanel>
  );
}
