// textarea 선택 영역 **bold** / *italic* 토글
export type MarkupWrap = "bold" | "italic";

const MARKERS: Record<MarkupWrap, { open: string; close: string }> = {
  bold: { open: "**", close: "**" },
  italic: { open: "*", close: "*" },
};

export type TextSelectionEdit = {
  text: string;
  selectionStart: number;
  selectionEnd: number;
};

function isWrapped(
  text: string,
  start: number,
  end: number,
  wrap: MarkupWrap,
): boolean {
  const { open, close } = MARKERS[wrap];
  return (
    start >= open.length &&
    end + close.length <= text.length &&
    text.slice(start - open.length, start) === open &&
    text.slice(end, end + close.length) === close
  );
}

export function toggleInlineMarkup(
  text: string,
  selectionStart: number,
  selectionEnd: number,
  wrap: MarkupWrap,
): TextSelectionEdit {
  const { open, close } = MARKERS[wrap];
  const hasSelection = selectionStart !== selectionEnd;

  if (hasSelection && isWrapped(text, selectionStart, selectionEnd, wrap)) {
    const nextText =
      text.slice(0, selectionStart - open.length) +
      text.slice(selectionStart, selectionEnd) +
      text.slice(selectionEnd + close.length);
    return {
      text: nextText,
      selectionStart: selectionStart - open.length,
      selectionEnd: selectionEnd - open.length,
    };
  }

  if (hasSelection) {
    const nextText =
      text.slice(0, selectionStart) +
      open +
      text.slice(selectionStart, selectionEnd) +
      close +
      text.slice(selectionEnd);
    return {
      text: nextText,
      selectionStart: selectionStart + open.length,
      selectionEnd: selectionEnd + open.length,
    };
  }

  const nextText =
    text.slice(0, selectionStart) + open + close + text.slice(selectionStart);
  return {
    text: nextText,
    selectionStart: selectionStart + open.length,
    selectionEnd: selectionStart + open.length,
  };
}
