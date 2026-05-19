"use client";

// 설정 중앙 모달 (테마·언어)
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import { useLocale, useTranslations } from "@/components/i18n/LocaleProvider";
import { useTheme } from "@/components/theme/ThemeProvider";
import { EditLanguageSettings } from "@/components/settings/EditLanguageSettings";
import { isEditMode } from "@/lib/edit/env";
import { getVisibleLocaleOptions } from "@/lib/site-locales";
import { duration, fadeScale, motionTransition } from "@/lib/motion";
import type { ThemeMode } from "@/lib/theme";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function SettingsModal({ open, onClose }: Props) {
  const t = useTranslations();
  const { locale, setLocale } = useLocale();
  const { mode, setMode } = useTheme();
  const dialogRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const themeModes: ThemeMode[] = ["system", "light", "dark"];
  const visibleLocales = getVisibleLocaleOptions();
  const editing = isEditMode();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
          role="presentation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={motionTransition(reduce, { duration: duration.fast })}
          onClick={onClose}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-title"
            className="w-full max-w-md rounded-lg bg-page-bg p-6 shadow-xl"
            variants={fadeScale}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={motionTransition(reduce, { duration: duration.fast })}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <h2
                id="settings-title"
                className="text-lg font-semibold text-page-heading"
              >
                {t("common.settings")}
              </h2>
              <motion.button
                type="button"
                onClick={onClose}
                className="interactive-button -mr-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-2xl leading-none text-page-body hover:bg-page-body/5 hover:text-secondary"
                aria-label={t("common.close")}
                whileTap={reduce ? undefined : { scale: 0.92 }}
              >
                ×
              </motion.button>
            </div>

            <div className="space-y-6">
              <div>
                <p className="mb-2 text-sm font-medium text-page-heading">
                  {t("theme.system")}
                </p>
                <div
                  className="flex gap-1.5 rounded-md border border-page-body/20 p-1"
                  role="group"
                >
                  {themeModes.map((m) => (
                    <motion.button
                      key={m}
                      type="button"
                      onClick={() => setMode(m)}
                      className={`interactive-button flex-1 rounded px-2 py-2 text-sm ${
                        mode === m
                          ? "bg-secondary text-secondary-foreground"
                          : "text-page-body hover:bg-page-body/5"
                      }`}
                      whileTap={reduce ? undefined : { scale: 0.98 }}
                    >
                      {t(`theme.${m}`)}
                    </motion.button>
                  ))}
                </div>
              </div>

              {editing ? (
                <EditLanguageSettings
                  selectedLocale={locale}
                  onSelectLocale={setLocale}
                />
              ) : (
                <motion.div>
                  <p className="mb-2 text-sm font-medium text-page-heading">Language</p>
                  <div className="flex gap-3">
                    {visibleLocales.map((opt) => (
                      <motion.button
                        key={opt.id}
                        type="button"
                        onClick={() => setLocale(opt.id)}
                        className={`interactive-button flex h-12 w-12 items-center justify-center rounded border-2 transition ${
                          locale === opt.id
                            ? "border-secondary"
                            : "border-transparent opacity-70 hover:opacity-100"
                        }`}
                        aria-label={opt.label}
                        aria-pressed={locale === opt.id}
                        whileTap={reduce ? undefined : { scale: 0.94 }}
                        whileHover={reduce ? undefined : { scale: 1.05 }}
                      >
                        <Image
                          src={opt.flagSrc}
                          alt=""
                          width={32}
                          height={20}
                          className="h-5 w-8"
                        />
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
