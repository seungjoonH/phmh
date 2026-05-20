// 속성 패널 textarea — locale 값 undo/redo 스택
import type { LocaleTextValues } from "@/lib/edit/client";

export type TextEditHistory = {
  past: LocaleTextValues[];
  future: LocaleTextValues[];
};

const MAX_DEPTH = 100;

export function createTextEditHistory(): TextEditHistory {
  return { past: [], future: [] };
}

function cloneValues(values: LocaleTextValues): LocaleTextValues {
  return { ...values };
}

export function resetTextEditHistory(history: TextEditHistory): void {
  history.past = [];
  history.future = [];
}

export function pushTextEditHistory(
  history: TextEditHistory,
  snapshot: LocaleTextValues,
): void {
  history.past.push(cloneValues(snapshot));
  if (history.past.length > MAX_DEPTH) history.past.shift();
  history.future = [];
}

export function undoTextEditHistory(
  history: TextEditHistory,
  current: LocaleTextValues,
): LocaleTextValues | null {
  const prev = history.past.pop();
  if (!prev) return null;
  history.future.unshift(cloneValues(current));
  return prev;
}

export function redoTextEditHistory(
  history: TextEditHistory,
  current: LocaleTextValues,
): LocaleTextValues | null {
  const next = history.future.shift();
  if (!next) return null;
  history.past.push(cloneValues(current));
  return next;
}
