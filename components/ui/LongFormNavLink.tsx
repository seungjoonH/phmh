"use client";

// 롱폼 사이드바 앵커 — 같은 페이지 내 부드러운 스크롤
import Link from "next/link";
import { editTextAttrs } from "@/lib/edit/attrs";
import { scrollToHash } from "@/lib/scroll-to-hash";

type Props = {
  href: string;
  label: string;
  labelEditKey?: string;
};

export function LongFormNavLink({ href, label, labelEditKey }: Props) {
  return (
    <Link
      href={href}
      className="interactive-link block"
      onClick={(e) => {
        if (!href.startsWith("#")) return;
        e.preventDefault();
        scrollToHash(href);
      }}
      {...(labelEditKey ? editTextAttrs(labelEditKey, { longPress: true }) : {})}
    >
      {label}
    </Link>
  );
}
