"use client";

// Theme + Locale Provider 래퍼 (edit 모드 시 EditChrome)
import dynamic from "next/dynamic";
import { LocaleProvider } from "@/components/i18n/LocaleProvider";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { isEditMode } from "@/lib/edit/env";

const EditChrome = dynamic(
  () => import("@/components/edit/EditChrome").then((m) => m.EditChrome),
  { ssr: false },
);

export function AppProviders({ children }: { children: React.ReactNode }) {
  const edit = isEditMode();

  return (
    <ThemeProvider>
      <LocaleProvider>
        {edit ? <EditChrome>{children}</EditChrome> : children}
      </LocaleProvider>
    </ThemeProvider>
  );
}
