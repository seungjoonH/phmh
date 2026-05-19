"use client";

// 편집 모드 UI — 툴바·highlight·패널·클릭/롱프레스
import { useEffect } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { EditDraftProvider, useEditDraft } from "@/components/edit/EditDraftProvider";
import { fetchLocaleManifest } from "@/lib/edit/client";
import { setRuntimeLocaleManifest } from "@/lib/site-locales";
import { EditToolbar } from "@/components/edit/EditToolbar";
import { EditHighlightLayer } from "@/components/edit/EditHighlightLayer";
import { EditPanels } from "@/components/edit/EditPanels";
import { EditPanelDismiss } from "@/components/edit/EditPanelDismiss";
import { EditPendingMarkers } from "@/components/edit/EditPendingMarkers";
import {
  clearLongPressPointer,
  markLongPressPointer,
} from "@/lib/edit/long-press-gesture";

const LONG_PRESS_MS = 600;

function LocaleManifestSync() {
  const { reloadLocales } = useLocale();
  useEffect(() => {
    fetchLocaleManifest()
      .then(async (manifest) => {
        setRuntimeLocaleManifest(manifest);
        await reloadLocales();
      })
      .catch(() => {});
  }, [reloadLocales]);
  return null;
}

function EditBodyClass() {
  useEffect(() => {
    document.body.classList.add("phmh-edit-active");
    return () => document.body.classList.remove("phmh-edit-active");
  }, []);
  return null;
}

function findEditableTarget(node: EventTarget | null): HTMLElement | null {
  if (!(node instanceof Element)) return null;
  return node.closest("[data-phmh-edit]") as HTMLElement | null;
}

function EditInteractionLayer() {
  const { openTextEditor, openImageEditor } = useEditDraft();

  useEffect(() => {
    type PendingLongPress = {
      timer: ReturnType<typeof setTimeout>;
      pointerId: number;
    };

    const pendingLongPress = new WeakMap<HTMLElement, PendingLongPress>();
    const longPressActivated = new WeakSet<HTMLElement>();
    let suppressClick = false;

    const dispatchSelected = (el: HTMLElement) => {
      window.dispatchEvent(
        new CustomEvent("phmh-edit-selected", { detail: { element: el } }),
      );
    };

    const openEditorFor = (el: HTMLElement) => {
      const key = el.dataset.phmhKey;
      const kind = el.dataset.phmhEdit;
      if (!key) return;
      if (kind === "text") {
        dispatchSelected(el);
        openTextEditor(key);
      } else if (kind === "image") {
        dispatchSelected(el);
        openImageEditor(key);
      }
    };

    const clearPendingLongPress = (el: HTMLElement, pointerId: number) => {
      const pending = pendingLongPress.get(el);
      if (!pending || pending.pointerId !== pointerId) return;
      clearTimeout(pending.timer);
      pendingLongPress.delete(el);
    };

    const startLongPress = (el: HTMLElement, e: PointerEvent) => {
      clearPendingLongPress(el, e.pointerId);
      longPressActivated.delete(el);

      const timer = setTimeout(() => {
        pendingLongPress.delete(el);
        longPressActivated.add(el);
        markLongPressPointer(e.pointerId);
        suppressClick = true;
        openEditorFor(el);
      }, LONG_PRESS_MS);

      pendingLongPress.set(el, { timer, pointerId: e.pointerId });
    };

    const shouldCaptureLongPress = (el: HTMLElement) =>
      el.dataset.phmhInteraction === "long-press" || el.dataset.phmhEdit === "image";

    const onPointerDown = (e: PointerEvent) => {
      const el = findEditableTarget(e.target);
      if (!el) return;

      if (shouldCaptureLongPress(el)) {
        e.preventDefault();
        try {
          el.setPointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
      }

      startLongPress(el, e);
    };

    const onPointerUp = (e: PointerEvent) => {
      clearLongPressPointer(e.pointerId);

      const el = findEditableTarget(e.target);
      if (el && longPressActivated.has(el)) {
        suppressClick = true;
        if (el.dataset.phmhInteraction === "long-press") {
          try {
            el.releasePointerCapture(e.pointerId);
          } catch {
            /* ignore */
          }
        }
        return;
      }

      if (el) clearPendingLongPress(el, e.pointerId);
    };

    const onPointerCancel = (e: PointerEvent) => {
      clearLongPressPointer(e.pointerId);

      const el = findEditableTarget(e.target);
      if (!el) return;
      clearPendingLongPress(el, e.pointerId);
      longPressActivated.delete(el);
    };

    const onClick = (e: MouseEvent) => {
      if (suppressClick) {
        suppressClick = false;
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return;
      }

      const el = findEditableTarget(e.target);
      if (!el) return;

      if (longPressActivated.has(el)) {
        longPressActivated.delete(el);
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return;
      }

      const interaction = el.dataset.phmhInteraction ?? "click";
      if (interaction === "click") {
        const key = el.dataset.phmhKey;
        if (!key) return;
        e.preventDefault();
        e.stopPropagation();
        openEditorFor(el);
      }
    };

    const onContextMenu = (e: Event) => {
      const el = findEditableTarget(e.target);
      if (el && shouldCaptureLongPress(el)) {
        e.preventDefault();
      }
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("pointerup", onPointerUp, true);
    document.addEventListener("pointercancel", onPointerCancel, true);
    document.addEventListener("click", onClick, true);
    document.addEventListener("contextmenu", onContextMenu, true);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("pointerup", onPointerUp, true);
      document.removeEventListener("pointercancel", onPointerCancel, true);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("contextmenu", onContextMenu, true);
    };
  }, [openTextEditor, openImageEditor]);

  return null;
}

function EditChromeInner() {
  return (
    <>
      <LocaleManifestSync />
      <EditToolbar />
      <EditHighlightLayer />
      <EditInteractionLayer />
      <EditPanels />
      <EditPanelDismiss />
      <EditPendingMarkers />
      <EditBodyClass />
    </>
  );
}

export function EditChrome({ children }: { children: React.ReactNode }) {
  return (
    <EditDraftProvider>
      {children}
      <EditChromeInner />
    </EditDraftProvider>
  );
}
