"use client";

// 롱폼 사이드바 앵커 — 같은 페이지 내 부드러운 스크롤
import Link from "next/link";
import { editTextAttrs } from "@/lib/edit/attrs";
import { scrollToHash } from "@/lib/scroll-to-hash";

type Props = {
  href: string;
  label: string;
  labelEditKey?: string;
  active?: boolean;
};

export function LongFormNavLink({ href, label, labelEditKey, active }: Props) {
  return (
    <Link
      href={href}
      className={`interactive-link block rounded-sm border-l-2 px-3 py-2 transition-[border-color,color,background-color] ${
        active
          ? "border-secondary bg-page-heading/10 font-medium text-page-heading"
          : "border-transparent"
      }`}
      aria-current={active ? "true" : undefined}
      onClick={(e) => {
        if (!href.startsWith("#")) return;
        e.preventDefault();
        const isKeyboard = e.detail === 0;
        scrollToHash(href, { focus: isKeyboard });
      }}
      {...(labelEditKey ? editTextAttrs(labelEditKey, { longPress: true }) : {})}
    >
      {label}
    </Link>
  );
}
