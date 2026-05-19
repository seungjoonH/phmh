"use client";

// 드래그 앤 드롭 시 삽입 위치 가이드 선
type Props = {
  position: "before" | "after";
  orientation?: "vertical" | "horizontal";
};

export function EditDropGuide({ position, orientation = "vertical" }: Props) {
  if (orientation === "horizontal") {
    return (
      <div
        className={`pointer-events-none absolute inset-y-0 z-30 flex flex-col items-center justify-center gap-1 py-1 ${
          position === "before" ? "-left-1" : "-right-1"
        }`}
        aria-hidden
      >
        <span className="size-1.5 shrink-0 rounded-full bg-secondary" />
        <span className="w-0.5 flex-1 rounded-full bg-secondary" />
        <span className="size-1.5 shrink-0 rounded-full bg-secondary" />
      </div>
    );
  }

  return (
    <div
      className={`pointer-events-none absolute inset-x-0 z-30 flex items-center gap-1 px-1 ${
        position === "before" ? "-top-1" : "-bottom-1"
      }`}
      aria-hidden
    >
      <span className="size-1.5 shrink-0 rounded-full bg-secondary" />
      <span className="h-0.5 flex-1 rounded-full bg-secondary" />
      <span className="size-1.5 shrink-0 rounded-full bg-secondary" />
    </div>
  );
}
