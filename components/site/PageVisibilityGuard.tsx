"use client";

// 숨김 페이지면 404 (편집 모드 draft 변경도 즉시 반영)
import { notFound } from "next/navigation";
import type { SitePageId } from "@/lib/site-pages";
import { isPageHidden } from "@/lib/site-pages-visibility";
import { useVisibilityEpoch } from "@/lib/edit/use-visibility-epoch";

type Props = {
  pageId: SitePageId;
  children: React.ReactNode;
};

export function PageVisibilityGuard({ pageId, children }: Props) {
  useVisibilityEpoch();
  if (isPageHidden(pageId)) {
    notFound();
  }
  return <>{children}</>;
}
