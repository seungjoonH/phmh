// 중첩 목록 ul/ol 렌더 — 마커 스타일(dash/dot/1./1)) 반영
import type { ListKind, ListTree, ListTreeNode } from "@/lib/edit/list-tree";
import { markerKind, markerPrefix } from "@/lib/edit/list-tree";
import { MarkupText } from "@/components/ui/MarkupText";

function markerListClass(marker: ListTreeNode["marker"]): string {
  switch (marker) {
    case "dot":
      return "list-disc";
    case "dash":
      return "list-none";
    case "decimal-dot":
      return "list-decimal";
    case "decimal-paren":
      return "list-none";
  }
}

function ListItemContent({
  node,
  index,
  kind,
}: {
  node: ListTreeNode;
  index: number;
  kind: ListKind;
}) {
  const showManualPrefix =
    node.marker === "dash" || node.marker === "decimal-paren";
  return (
    <>
      {showManualPrefix ? (
        <span className="mr-1 select-none text-page-body/80">
          {kind === "ordered"
            ? markerPrefix(node.marker, index).trimEnd()
            : "–"}
        </span>
      ) : null}
      <MarkupText as="span">{node.text}</MarkupText>
    </>
  );
}

function NestedListLevel({ nodes, depth = 0 }: { nodes: ListTree; depth?: number }) {
  if (nodes.length === 0) return null;
  const kind = markerKind(nodes[0].marker);
  const Tag = kind === "ordered" ? "ol" : "ul";
  const listClass = markerListClass(nodes[0].marker);
  let order = 1;

  return (
    <Tag className={`${listClass} space-y-2 pl-6 marker:text-page-body`}>
      {nodes.map((node, i) => {
        const index = kind === "ordered" ? order++ : i + 1;
        return (
          <li key={i}>
            <div
              className={
                node.marker === "dash" || node.marker === "decimal-paren"
                  ? "flex gap-0"
                  : undefined
              }
            >
              <ListItemContent node={node} index={index} kind={kind} />
            </div>
            {node.children?.length ? (
              <NestedListLevel nodes={node.children} depth={depth + 1} />
            ) : null}
          </li>
        );
      })}
    </Tag>
  );
}

export function NestedList({ tree }: { tree: ListTree }) {
  return <NestedListLevel nodes={tree} />;
}
