"use client";

// 사이트 페이지 노출 패널 — 트리 구조, draft 토글, 저장 전 미리보기
import { useEffect, useMemo, useState } from "react";
import { useEditDraft } from "@/components/edit/EditDraftProvider";
import { fetchSitePagesRegistry } from "@/lib/edit/client";
import {
  SITE_PAGE_GROUPS,
  STATIC_SITE_PAGES,
  therapistProfilePageId,
  type SitePageEntry,
  type SitePageGroup,
} from "@/lib/site-pages";

type GroupedPages = {
  group: SitePageGroup;
  label: string;
  pages: SitePageEntry[];
};

type StandaloneEntry = { kind: "page"; page: SitePageEntry };
type GroupEntry = { kind: "group"; group: GroupedPages };
type TherapistsEntry = { kind: "therapists"; list: SitePageEntry; slugs: string[] };

type TreeNode = GroupEntry | StandaloneEntry | TherapistsEntry;

function buildTree(slugs: string[]): TreeNode[] {
  const therapistsList = STATIC_SITE_PAGES.find((p) => p.id === "therapists.list")!;
  const grouped = new Map<SitePageGroup, SitePageEntry[]>();
  const standalone: SitePageEntry[] = [];

  for (const page of STATIC_SITE_PAGES) {
    if (page.id === "therapists.list") continue;
    if (page.group && page.group !== "therapists") {
      const list = grouped.get(page.group) ?? [];
      list.push(page);
      grouped.set(page.group, list);
    } else {
      standalone.push(page);
    }
  }

  const nodes: TreeNode[] = [];
  const groupOrder: SitePageGroup[] = ["about", "services"];
  for (const id of groupOrder) {
    const pages = grouped.get(id);
    if (!pages) continue;
    const meta = SITE_PAGE_GROUPS.find((g) => g.id === id)!;
    nodes.push({ kind: "group", group: { group: id, label: meta.label, pages } });
  }

  for (const page of standalone) {
    nodes.push({ kind: "page", page });
  }

  for (const id of ["fee", "contact"] as SitePageGroup[]) {
    const pages = grouped.get(id);
    if (!pages) continue;
    const meta = SITE_PAGE_GROUPS.find((g) => g.id === id)!;
    nodes.push({ kind: "group", group: { group: id, label: meta.label, pages } });
  }

  nodes.push({ kind: "therapists", list: therapistsList, slugs });

  return nodes;
}

export function SitePagesPanel({ onClose }: { onClose: () => void }) {
  const { sitePagesHiddenDraft, setSitePagesHiddenDraft } = useEditDraft();
  const [slugs, setSlugs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSitePagesRegistry()
      .then((data) => {
        setSlugs(data.therapistSlugs ?? []);
        if (sitePagesHiddenDraft === null) {
          setSitePagesHiddenDraft(data.hidden ?? []);
        }
      })
      .finally(() => setLoading(false));
  }, [sitePagesHiddenDraft, setSitePagesHiddenDraft]);

  const hiddenSet = useMemo(
    () => new Set(sitePagesHiddenDraft ?? []),
    [sitePagesHiddenDraft],
  );

  const tree = useMemo(() => buildTree(slugs), [slugs]);

  const toggle = (id: string) => {
    const next = new Set(hiddenSet);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSitePagesHiddenDraft([...next]);
  };

  return (
    <div
      className="fixed inset-y-0 right-0 z-[60] w-full max-w-md overflow-y-auto border-l border-page-body/15 bg-page-bg p-6 shadow-xl"
      data-phmh-edit-panel
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium text-page-title">페이지 노출</h2>
        <button type="button" className="text-sm text-secondary" onClick={onClose}>
          닫기
        </button>
      </div>
      {loading ? (
        <p className="text-sm text-page-body">불러오는 중…</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {tree.map((node) => {
            if (node.kind === "page") {
              const isHidden = hiddenSet.has(node.page.id);
              return (
                <PageRow
                  key={node.page.id}
                  label={node.page.label}
                  hidden={isHidden}
                  onToggle={() => toggle(node.page.id)}
                />
              );
            }

            if (node.kind === "group") {
              const groupHidden = hiddenSet.has(node.group.group);
              return (
                <li key={node.group.group} className="space-y-1">
                  <PageRow
                    label={node.group.label}
                    hidden={groupHidden}
                    onToggle={() => toggle(node.group.group)}
                    bold
                  />
                  {node.group.pages.map((page) => {
                    const isHidden = hiddenSet.has(page.id);
                    return (
                      <PageRow
                        key={page.id}
                        label={page.label}
                        hidden={isHidden}
                        groupHidden={groupHidden}
                        onToggle={() => toggle(page.id)}
                        indent
                      />
                    );
                  })}
                </li>
              );
            }

            const listHidden = hiddenSet.has(node.list.id);
            return (
              <li key={node.list.id} className="space-y-1">
                <PageRow
                  label={node.list.label}
                  hidden={listHidden}
                  onToggle={() => toggle(node.list.id)}
                  bold
                />
                {node.slugs.map((slug) => {
                  const id = therapistProfilePageId(slug);
                  const isHidden = hiddenSet.has(id);
                  return (
                    <PageRow
                      key={id}
                      label={slug}
                      hidden={isHidden}
                      groupHidden={listHidden}
                      onToggle={() => toggle(id)}
                      indent
                    />
                  );
                })}
              </li>
            );
          })}
        </ul>
      )}
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
    <li
      className={`flex items-center justify-between gap-2 ${
        indent ? "pl-4" : ""
      }`}
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
    </li>
  );
}
