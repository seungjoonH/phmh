"use client";

// 사이트 페이지 노출/순서 패널 — 드래그 핸들로 카테고리·하위 페이지·상담사 reorder
import { useEffect, useMemo, useRef, useState } from "react";
import { useEditDraft } from "@/components/edit/EditDraftProvider";
import { EditDragHandle } from "@/components/edit/EditDragHandle";
import { useEditReorderDrag } from "@/components/edit/useEditReorderDrag";
import { fetchSitePagesRegistry } from "@/lib/edit/client";
import {
  DEFAULT_GROUP_ORDER,
  DEFAULT_TOP_ORDER,
  isSitePageGroup,
  SITE_PAGE_GROUPS,
  STATIC_SITE_PAGES,
  centerProfilePageId,
  therapistProfilePageId,
  type SitePageEntry,
  type SitePageGroup,
  type SiteTopEntryId,
} from "@/lib/site-pages";

type TopEntry =
  | { kind: "group"; id: SitePageGroup; label: string; pages: SitePageEntry[] }
  | { kind: "page"; id: SiteTopEntryId; entry: SitePageEntry }
  | { kind: "centers"; id: "center"; entry: SitePageEntry }
  | { kind: "therapists"; id: "therapists.list"; entry: SitePageEntry };

function reorderArray<T>(arr: T[], from: number, to: number): T[] {
  if (from === to) return arr;
  const next = [...arr];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

function buildTopEntries(topOrder: SiteTopEntryId[]): TopEntry[] {
  const groupPages = new Map<SitePageGroup, SitePageEntry[]>();
  const byId = new Map<string, SitePageEntry>();
  for (const page of STATIC_SITE_PAGES) {
    byId.set(page.id, page);
    if (page.group && page.group !== "therapists") {
      const list = groupPages.get(page.group) ?? [];
      list.push(page);
      groupPages.set(page.group, list);
    }
  }
  const entries: TopEntry[] = [];
  for (const top of topOrder) {
    if (isSitePageGroup(top)) {
      if (top === "center") {
        const entry = byId.get("centers.list");
        if (!entry) continue;
        entries.push({ kind: "centers", id: "center", entry });
        continue;
      }
      const meta = SITE_PAGE_GROUPS.find((g) => g.id === top);
      if (!meta) continue;
      entries.push({
        kind: "group",
        id: top,
        label: meta.label,
        pages: groupPages.get(top) ?? [],
      });
    } else if (top === "therapists.list") {
      const entry = byId.get("therapists.list");
      if (!entry) continue;
      entries.push({ kind: "therapists", id: "therapists.list", entry });
    } else {
      const entry = byId.get(top);
      if (!entry) continue;
      entries.push({ kind: "page", id: top, entry });
    }
  }
  return entries;
}

function applyGroupOrder(
  pages: SitePageEntry[],
  order: string[] | undefined,
): SitePageEntry[] {
  if (!order || order.length === 0) return pages;
  const byId = new Map<string, SitePageEntry>(pages.map((p) => [p.id, p]));
  const seen = new Set<string>();
  const out: SitePageEntry[] = [];
  for (const id of order) {
    const page = byId.get(id);
    if (page && !seen.has(id)) {
      seen.add(id);
      out.push(page);
    }
  }
  for (const page of pages) {
    if (!seen.has(page.id)) out.push(page);
  }
  return out;
}

export function SitePagesPanel({ onClose }: { onClose: () => void }) {
  const {
    sitePagesHiddenDraft,
    setSitePagesHiddenDraft,
    sitePagesTopOrderDraft,
    sitePagesGroupOrderDraft,
    sitePagesCenterOrderDraft,
    sitePagesTherapistOrderDraft,
    setSitePagesTopOrderDraft,
    setSitePagesGroupOrderDraft,
    setSitePagesCenterOrderDraft,
    setSitePagesTherapistOrderDraft,
  } = useEditDraft();
  const [baselineCenterSlugs, setBaselineCenterSlugs] = useState<string[]>([]);
  const [baselineTherapistSlugs, setBaselineTherapistSlugs] = useState<string[]>([]);
  const [baselineTopOrder, setBaselineTopOrder] =
    useState<SiteTopEntryId[]>(DEFAULT_TOP_ORDER);
  const [baselineGroupOrder, setBaselineGroupOrder] = useState<
    Record<string, string[]>
  >(DEFAULT_GROUP_ORDER as Record<string, string[]>);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.isComposing) return;
      event.preventDefault();
      onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  useEffect(() => {
    fetchSitePagesRegistry()
      .then((data) => {
        setBaselineCenterSlugs(data.centerSlugs ?? []);
        setBaselineTherapistSlugs(data.therapistSlugs ?? []);
        const isValidTopId = (id: string): id is SiteTopEntryId =>
          isSitePageGroup(id) || id === "getting-started" || id === "therapists.list";
        setBaselineTopOrder(
          data.topOrder?.length
            ? (data.topOrder.filter(isValidTopId) as SiteTopEntryId[])
            : DEFAULT_TOP_ORDER,
        );
        setBaselineGroupOrder(
          data.groupOrder && Object.keys(data.groupOrder).length > 0
            ? data.groupOrder
            : (DEFAULT_GROUP_ORDER as Record<string, string[]>),
        );
        if (sitePagesHiddenDraft === null) {
          setSitePagesHiddenDraft(data.hidden ?? []);
        }
      })
      .finally(() => setLoading(false));
  }, [sitePagesHiddenDraft, setSitePagesHiddenDraft]);

  const topOrder = useMemo<SiteTopEntryId[]>(() => {
    const candidate = sitePagesTopOrderDraft ?? baselineTopOrder;
    const isValidTopId = (id: string): id is SiteTopEntryId =>
      isSitePageGroup(id) || id === "getting-started" || id === "therapists.list";
    return candidate.filter(isValidTopId);
  }, [sitePagesTopOrderDraft, baselineTopOrder]);
  const groupOrder = useMemo<Record<string, string[]>>(
    () => sitePagesGroupOrderDraft ?? baselineGroupOrder,
    [sitePagesGroupOrderDraft, baselineGroupOrder],
  );
  const therapistOrder = useMemo<string[]>(
    () => sitePagesTherapistOrderDraft ?? baselineTherapistSlugs,
    [sitePagesTherapistOrderDraft, baselineTherapistSlugs],
  );
  const centerOrder = useMemo<string[]>(
    () => sitePagesCenterOrderDraft ?? baselineCenterSlugs,
    [sitePagesCenterOrderDraft, baselineCenterSlugs],
  );
  const hiddenSet = useMemo(
    () => new Set(sitePagesHiddenDraft ?? []),
    [sitePagesHiddenDraft],
  );

  const topEntries = useMemo(() => buildTopEntries(topOrder), [topOrder]);

  const toggle = (id: string) => {
    const next = new Set(hiddenSet);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSitePagesHiddenDraft([...next]);
  };

  const topDrag = useEditReorderDrag({ axis: "y" });
  topDrag.createDropHandler((from, to) => {
    const next = reorderArray(topOrder, from, to);
    setSitePagesTopOrderDraft(next as string[]);
  });

  const containerClass =
    "fixed inset-y-0 right-0 z-[60] w-full max-w-md overflow-y-auto border-l border-page-body/15 bg-page-bg p-6 shadow-xl";

  return (
    <div className={containerClass} data-phmh-edit-panel>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium text-page-title">페이지 노출 / 순서</h2>
        <button type="button" className="text-sm text-secondary" onClick={onClose}>
          닫기
        </button>
      </div>
      {loading ? (
        <p className="text-sm text-page-body">불러오는 중…</p>
      ) : (
        <ul data-edit-reorder-list className="space-y-1 text-sm">
          {topEntries.map((node, topIdx) => (
            <ReorderRow
              key={node.id}
              index={topIdx}
              dragIndex={topDrag.dragIndex}
              rowShift={topDrag.getRowShift(topIdx)}
              onDragStart={topDrag.beginDrag}
            >
              {node.kind === "page" ? (
                <PageRow
                  label={node.entry.label}
                  hidden={hiddenSet.has(node.entry.id)}
                  onToggle={() => toggle(node.entry.id)}
                />
              ) : node.kind === "group" ? (
                <GroupBlock
                  group={node}
                  hiddenSet={hiddenSet}
                  groupHidden={hiddenSet.has(node.id)}
                  pageOrder={(groupOrder[node.id] ?? []) as string[]}
                  onToggle={toggle}
                  onPageOrderChange={(next) =>
                    setSitePagesGroupOrderDraft(node.id, next)
                  }
                />
              ) : node.kind === "centers" ? (
                <CentersBlock
                  entry={node.entry}
                  hidden={hiddenSet.has(node.entry.id)}
                  hiddenSet={hiddenSet}
                  slugs={centerOrder}
                  onToggle={toggle}
                  onSlugOrderChange={(next) =>
                    setSitePagesCenterOrderDraft(next)
                  }
                />
              ) : (
                <TherapistsBlock
                  entry={node.entry}
                  hidden={hiddenSet.has(node.id)}
                  hiddenSet={hiddenSet}
                  slugs={therapistOrder}
                  onToggle={toggle}
                  onSlugOrderChange={(next) =>
                    setSitePagesTherapistOrderDraft(next)
                  }
                />
              )}
            </ReorderRow>
          ))}
        </ul>
      )}
    </div>
  );
}

type ReorderRowProps = {
  index: number;
  dragIndex: number | null;
  rowShift: { x: number; y: number };
  onDragStart: (
    index: number,
    rowEl: HTMLElement,
    e: React.PointerEvent,
  ) => void;
  children: React.ReactNode;
};

function ReorderRow({
  index,
  dragIndex,
  rowShift,
  onDragStart,
  children,
}: ReorderRowProps) {
  const rowRef = useRef<HTMLLIElement>(null);
  const isSource = dragIndex === index;
  return (
    <li
      ref={rowRef}
      data-edit-reorder-index={index}
      className="relative flex items-start gap-2"
      style={{
        transform:
          rowShift.y !== 0 ? `translate3d(0, ${rowShift.y}px, 0)` : undefined,
        transition: "transform 380ms cubic-bezier(0.22, 1, 0.36, 1)",
        visibility: isSource ? "hidden" : undefined,
      }}
    >
      <EditDragHandle
        index={index}
        active={isSource}
        className="mt-0.5"
        onPointerDownStart={(e) => {
          if (!rowRef.current) return;
          onDragStart(index, rowRef.current, e);
        }}
      />
      <div className="min-w-0 flex-1">{children}</div>
    </li>
  );
}

type GroupBlockProps = {
  group: { id: SitePageGroup; label: string; pages: SitePageEntry[] };
  groupHidden: boolean;
  hiddenSet: Set<string>;
  pageOrder: string[];
  onToggle: (id: string) => void;
  onPageOrderChange: (next: string[]) => void;
};

function GroupBlock({
  group,
  groupHidden,
  hiddenSet,
  pageOrder,
  onToggle,
  onPageOrderChange,
}: GroupBlockProps) {
  const orderedPages = useMemo(
    () => applyGroupOrder(group.pages, pageOrder),
    [group.pages, pageOrder],
  );

  const drag = useEditReorderDrag({ axis: "y" });
  drag.createDropHandler((from, to) => {
    const ids = orderedPages.map((p) => p.id);
    const next = reorderArray(ids, from, to);
    onPageOrderChange(next);
  });

  return (
    <div className="space-y-1">
      <PageRow
        label={group.label}
        hidden={groupHidden}
        onToggle={() => onToggle(group.id)}
        bold
      />
      <ul data-edit-reorder-list className="space-y-0.5 pl-4">
        {orderedPages.map((page, idx) => (
          <ReorderRow
            key={page.id}
            index={idx}
            dragIndex={drag.dragIndex}
            rowShift={drag.getRowShift(idx)}
            onDragStart={drag.beginDrag}
          >
            <PageRow
              label={page.label}
              hidden={hiddenSet.has(page.id)}
              groupHidden={groupHidden}
              onToggle={() => onToggle(page.id)}
              indent
            />
          </ReorderRow>
        ))}
      </ul>
    </div>
  );
}

type CentersBlockProps = {
  entry: SitePageEntry;
  hidden: boolean;
  hiddenSet: Set<string>;
  slugs: string[];
  onToggle: (id: string) => void;
  onSlugOrderChange: (next: string[]) => void;
};

function CentersBlock({
  entry,
  hidden,
  hiddenSet,
  slugs,
  onToggle,
  onSlugOrderChange,
}: CentersBlockProps) {
  const drag = useEditReorderDrag({ axis: "y" });
  drag.createDropHandler((from, to) => {
    const next = reorderArray(slugs, from, to);
    onSlugOrderChange(next);
  });

  return (
    <div className="space-y-1">
      <PageRow
        label="Center"
        hidden={hidden}
        onToggle={() => onToggle(entry.id)}
        bold
      />
      <ul data-edit-reorder-list className="space-y-0.5 pl-4">
        {slugs.map((slug, idx) => {
          const id = centerProfilePageId(slug);
          return (
            <ReorderRow
              key={id}
              index={idx}
              dragIndex={drag.dragIndex}
              rowShift={drag.getRowShift(idx)}
              onDragStart={drag.beginDrag}
            >
              <PageRow
                label={slug}
                hidden={hiddenSet.has(id)}
                groupHidden={hidden}
                onToggle={() => onToggle(id)}
                indent
              />
            </ReorderRow>
          );
        })}
      </ul>
    </div>
  );
}

type TherapistsBlockProps = {
  entry: SitePageEntry;
  hidden: boolean;
  hiddenSet: Set<string>;
  slugs: string[];
  onToggle: (id: string) => void;
  onSlugOrderChange: (next: string[]) => void;
};

function TherapistsBlock({
  entry,
  hidden,
  hiddenSet,
  slugs,
  onToggle,
  onSlugOrderChange,
}: TherapistsBlockProps) {
  const drag = useEditReorderDrag({ axis: "y" });
  drag.createDropHandler((from, to) => {
    const next = reorderArray(slugs, from, to);
    onSlugOrderChange(next);
  });

  return (
    <div className="space-y-1">
      <PageRow
        label={entry.label}
        hidden={hidden}
        onToggle={() => onToggle(entry.id)}
        bold
      />
      <ul data-edit-reorder-list className="space-y-0.5 pl-4">
        {slugs.map((slug, idx) => {
          const id = therapistProfilePageId(slug);
          return (
            <ReorderRow
              key={id}
              index={idx}
              dragIndex={drag.dragIndex}
              rowShift={drag.getRowShift(idx)}
              onDragStart={drag.beginDrag}
            >
              <PageRow
                label={slug}
                hidden={hiddenSet.has(id)}
                groupHidden={hidden}
                onToggle={() => onToggle(id)}
                indent
              />
            </ReorderRow>
          );
        })}
      </ul>
    </div>
  );
}

function PageRow({
  label,
  hidden,
  groupHidden,
  onToggle,
  indent,
  bold,
}: {
  label: string;
  hidden: boolean;
  groupHidden?: boolean;
  onToggle: () => void;
  indent?: boolean;
  bold?: boolean;
}) {
  const effectivelyHidden = hidden || groupHidden;
  return (
    <div
      className={`flex items-center justify-between gap-2 ${indent ? "pl-1" : ""}`}
    >
      <span className={bold ? "font-medium" : ""}>{label}</span>
      <button
        type="button"
        className={`rounded px-2 py-1 text-xs ${
          effectivelyHidden ? "bg-page-body/10 text-page-body/70" : "bg-primary/15 text-page-title"
        }`}
        onClick={onToggle}
        disabled={groupHidden && !hidden}
        title={groupHidden && !hidden ? "상위 카테고리가 숨겨져 있습니다" : undefined}
      >
        {groupHidden && !hidden ? "그룹 숨김" : hidden ? "숨김" : "표시"}
      </button>
    </div>
  );
}
