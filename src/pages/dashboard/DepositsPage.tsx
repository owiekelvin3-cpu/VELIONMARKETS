import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ArrowLeft, Shield } from "@/lib/icons";
import { FadeIn } from "@/components/motion/Motion";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { DepositMethodCard } from "@/components/dashboard/DepositMethodCard";
import { DepositFundsShowcase } from "@/components/dashboard/DepositFundsShowcase";
import { CryptoIconGrid, GiftCardIconGrid } from "@/components/dashboard/DepositIcons";
import { DashboardSheet } from "@/components/dashboard/DashboardSheet";

export default function DepositsPage() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        eyebrow={t("dashboard.navGroupCash")}
        title={t("deposits.title")}
        subtitle={t("deposits.subtitle")}
        actions={
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="h-3.5 w-3.5" />
              {t("dashboard.overview")}
            </Link>
          </Button>
        }
      />

      <DashboardSheet>
        <FadeIn className="space-y-4">
          <DepositMethodCard
            to="/dashboard/deposits/crypto"
            title={t("deposits.cryptoTitle")}
            description={t("deposits.cryptoDesc")}
            iconGrid={<CryptoIconGrid size="lg" />}
            iconRow={<CryptoIconGrid size="sm" />}
          />

          <DepositMethodCard
            to="/dashboard/deposits/gift-card"
            title={t("deposits.giftCardTitle")}
            description={t("deposits.giftCardDesc")}
            iconGrid={<GiftCardIconGrid size="lg" />}
            iconRow={<GiftCardIconGrid size="sm" />}
          />

          <div className="surface-muted flex gap-4 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-muted">
              <Shield className="h-4 w-4" aria-hidden="true" />
            </div>
            <p className="text-sm leading-relaxed text-muted">{t("deposits.verificationNote")}</p>
          </div>

          <DepositFundsShowcase />
        </FadeIn>
      </DashboardSheet>
    </div>
  );
}
