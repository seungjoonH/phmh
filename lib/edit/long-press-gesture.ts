// 롱프레스 제스처 — 패널 열림 동안 pointerup 전까지 dismiss 억제
let activePointerId: number | null = null;

export function markLongPressPointer(pointerId: number) {
  activePointerId = pointerId;
}

export function clearLongPressPointer(pointerId: number) {
  if (activePointerId === pointerId) activePointerId = null;
}

export function shouldSuppressPanelDismiss(pointerId: number): boolean {
  return activePointerId !== null && activePointerId === pointerId;
}
