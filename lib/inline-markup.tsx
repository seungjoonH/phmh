// locale 문자열의 **bold**, *italic* 인라인 마크업 파서
import { Fragment, type ReactNode } from "react";

type MarkupPart = { kind: "text" | "bold" | "italic"; value: string };

function tokenizeInlineMarkup(input: string): MarkupPart[] {
  const parts: MarkupPart[] = [];
  let i = 0;

  while (i < input.length) {
    if (input.startsWith("**", i)) {
      const end = input.indexOf("**", i + 2);
      if (end !== -1) {
        parts.push({ kind: "bold", value: input.slice(i + 2, end) });
        i = end + 2;
        continue;
      }
    }

    if (input[i] === "*" && input[i + 1] !== "*") {
      const end = input.indexOf("*", i + 1);
      if (end !== -1 && input[end + 1] !== "*") {
        parts.push({ kind: "italic", value: input.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }

    const next = input.indexOf("*", i);
    const end = next === -1 ? input.length : next;
    if (end > i) {
      parts.push({ kind: "text", value: input.slice(i, end) });
    }
    i = end === i ? i + 1 : end;
  }

  return parts.filter((p) => p.value.length > 0);
}

export function renderInlineMarkup(text: string): ReactNode {
  return tokenizeInlineMarkup(text).map((part, index) => {
    if (part.kind === "bold") {
      return (
        <strong key={index} className="font-semibold text-page-body">
          {renderInlineMarkup(part.value)}
        </strong>
      );
    }
    if (part.kind === "italic") {
      return (
        <em key={index} className="italic text-page-body/90">
          {renderInlineMarkup(part.value)}
        </em>
      );
    }
    return <Fragment key={index}>{part.value}</Fragment>;
  });
}
