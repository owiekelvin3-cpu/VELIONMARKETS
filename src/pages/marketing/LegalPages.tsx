import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { BRAND } from "@/constants/brand";
import { PageHero } from "@/components/marketing/PageHero";
import { FadeIn } from "@/components/motion/Motion";
import { GlassCard } from "@/components/ui/glass-card";

function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  const { t } = useTranslation();

  return (
    <>
      <PageHero badge={t("pages.legalBadge")} title={title} />
      <section className="pb-24">
        <div className="container mx-auto px-4">
          <FadeIn className="mx-auto max-w-3xl">
            <GlassCard className="prose prose-invert max-w-none">
              <div className="space-y-6 text-muted leading-relaxed [&_h2]:text-foreground [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-8 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2">
                {children}
              </div>
              <p className="mt-10 text-sm text-muted border-t border-border pt-6">
                {t("pages.legalUpdated")}{" "}
                <a href={`mailto:${BRAND.complianceEmail}`} className="text-emerald hover:underline">
                  {BRAND.complianceEmail}
                </a>
              </p>
            </GlassCard>
          </FadeIn>
        </div>
      </section>
    </>
  );
}

export function PrivacyPage() {
  const { t } = useTranslation();

  return (
    <LegalPage title={t("pages.privacyTitle")}>
      <p>{t("pages.privacyIntro", { entity: BRAND.legalEntity })}</p>
      <h2>{t("pages.privacyCollect")}</h2>
      <p>{t("pages.privacyCollectBody")}</p>
      <h2>{t("pages.privacyUse")}</h2>
      <p>{t("pages.privacyUseBody")}</p>
      <h2>{t("pages.privacySecurity")}</h2>
      <p>{t("pages.privacySecurityBody")}</p>
      <h2>{t("pages.privacyRights")}</h2>
      <p>{t("pages.privacyRightsBody")}</p>
    </LegalPage>
  );
}

export function TermsPage() {
  const { t } = useTranslation();

  return (
    <LegalPage title={t("pages.termsTitle")}>
      <p>{t("pages.termsIntro")}</p>
      <h2>{t("pages.termsAccount")}</h2>
      <p>{t("pages.termsAccountBody")}</p>
      <h2>{t("pages.termsRisks")}</h2>
      <p>{t("pages.termsRisksBody")}</p>
      <h2>{t("pages.termsFees")}</h2>
      <p>{t("pages.termsFeesBody")}</p>
    </LegalPage>
  );
}

export function CookiesPage() {
  const { t } = useTranslation();

  return (
    <LegalPage title={t("pages.cookiesTitle")}>
      <p>{t("pages.cookiesIntro")}</p>
      <h2>{t("pages.cookiesWhat")}</h2>
      <p>{t("pages.cookiesWhatBody")}</p>
      <h2>{t("pages.cookiesTypes")}</h2>
      <ul>
        <li>
          <strong>{t("pages.cookiesEssential")}</strong>
        </li>
        <li>
          <strong>{t("pages.cookiesAnalytics")}</strong>
        </li>
        <li>
          <strong>{t("pages.cookiesPreferences")}</strong>
        </li>
      </ul>
    </LegalPage>
  );
}
