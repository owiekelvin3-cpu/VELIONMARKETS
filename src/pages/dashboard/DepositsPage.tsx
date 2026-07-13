import { useTranslation } from "react-i18next";
import { Shield } from "@/lib/icons";
import { FadeIn } from "@/components/motion/Motion";
import { DepositPageHeader } from "@/components/dashboard/DepositPageHeader";
import { DepositMethodCard } from "@/components/dashboard/DepositMethodCard";
import { DepositFundsShowcase } from "@/components/dashboard/DepositFundsShowcase";
import { CryptoIconGrid, GiftCardIconGrid } from "@/components/dashboard/DepositIcons";

export default function DepositsPage() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-3xl">
      <DepositPageHeader
        title={t("deposits.title")}
        subtitle={t("deposits.subtitle")}
        backTo="/dashboard"
      />

      <FadeIn className="space-y-6">
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

        <div className="flex gap-4 rounded-2xl border border-dashed border-border bg-secondary/50 p-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald/10">
            <Shield className="h-5 w-5 text-emerald" aria-hidden="true" />
          </div>
          <p className="text-sm leading-relaxed text-muted">{t("deposits.verificationNote")}</p>
        </div>

        <DepositFundsShowcase />
      </FadeIn>
    </div>
  );
}
