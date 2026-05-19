"use client";

// Online payment 껍데기 UI
import { useState } from "react";
import { Reveal } from "@/components/motion/Reveal";
import { PageHeroBanner } from "@/components/ui/PageHeroBanner";
import { useTranslations } from "@/components/i18n/LocaleProvider";
import { pageHeroes } from "@/lib/page-heroes";
import { siteConfig } from "@/lib/config";

export function PaymentShell() {
  const t = useTranslations();
  const [step, setStep] = useState<1 | 2>(1);
  const amount = siteConfig.payment.products[0].amountUsd;

  return (
    <article>
      <PageHeroBanner src={pageHeroes.fee} editKey="heroes.fee" />
      <div className="page-container">
        <Reveal>
          <h1 className="page-title">{t("payment.pageTitle")}</h1>
          <div className="page-title-rule" />
        </Reveal>

        <Reveal delay={0.08} className="mx-auto mt-12 max-w-2xl">
          <h2 className="text-center font-logo text-2xl text-page-heading">
            {t("payment.checkoutTitle")}
          </h2>
          <p className="mt-2 text-center text-page-body">
            {step === 1 ? t("payment.stepDetails") : t("payment.stepPayment")}
          </p>

          <div className="mt-8 rounded border border-page-body/15 p-6">
            <p className="font-semibold">{t("payment.products.individualSessionDbq.label")}</p>
            <p className="mt-2 text-2xl text-page-heading">${amount.toFixed(2)} USD</p>

            {step === 1 ? (
              <div className="mt-6 space-y-4">
                <input
                  className="input-underline"
                  placeholder={t("payment.fields.email")}
                  disabled
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    className="input-underline"
                    placeholder={t("payment.fields.lastName")}
                    disabled
                  />
                  <input
                    className="input-underline"
                    placeholder={t("payment.fields.firstName")}
                    disabled
                  />
                </div>
                <button
                  type="button"
                  className="cta-primary"
                  onClick={() => setStep(2)}
                >
                  {t("payment.continue")}
                </button>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                <button
                  type="button"
                  className="text-sm text-secondary"
                  onClick={() => setStep(1)}
                >
                  ← {t("payment.back")}
                </button>
                <p className="text-sm text-page-body/80">{t("payment.paypalNotice")}</p>
                <div className="flex flex-col gap-3">
                  {siteConfig.payment.providers.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      disabled
                      className="rounded border border-page-body/20 px-4 py-3 text-left opacity-60"
                    >
                      {t(`payment.providers.${p.id}`)} — {t("common.comingSoon")}
                    </button>
                  ))}
                </div>
                <p className="text-center text-xs text-page-body/60">
                  {t("payment.sslBadge")}
                </p>
              </div>
            )}
          </div>
        </Reveal>
      </div>
    </article>
  );
}
