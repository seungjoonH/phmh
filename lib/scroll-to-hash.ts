// 앵커 해시 스크롤 — 섹션 이미지가 아닌 제목(h1/h2)으로 이동
export function scrollToHash(href: string, options?: { focus?: boolean }): void {
  if (!href.startsWith("#")) return;

  const id = href.slice(1);
  let target: HTMLElement | null = null;

  if (id === "top") {
    target =
      document.querySelector<HTMLElement>(".page-title") ??
      document.getElementById("top");
  } else {
    const section = document.getElementById(id);
    target =
      section?.querySelector<HTMLElement>("h2") ??
      section?.querySelector<HTMLElement>("h1") ??
      section;
  }

  if (!target) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  window.history.replaceState(null, "", href);

  if (options?.focus === false) return;
  if (!target.hasAttribute("tabindex")) {
    target.setAttribute("tabindex", "-1");
  }
  target.focus({ preventScroll: true });
}
