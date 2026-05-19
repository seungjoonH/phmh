"use client";

// 빈 locale 문구 자리표시 (+)
export function EditEmptyPlaceholder() {
  return (
    <span
      className="inline-flex min-h-[1.5em] min-w-[2rem] items-center justify-center rounded border border-dashed border-primary/35 px-2 text-lg font-light text-primary/70"
      aria-hidden
    >
      +
    </span>
  );
}
