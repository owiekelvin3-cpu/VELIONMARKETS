import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FadeIn } from "@/components/motion/Motion";
import { DepositPageHeader } from "@/components/dashboard/DepositPageHeader";
import { DashboardSheet } from "@/components/dashboard/DashboardSheet";
import { GiftCardBrandIcon } from "@/components/dashboard/DepositIcons";
import { GIFT_CARD_BRANDS } from "@/constants/deposit-assets";

export default function GiftCardDepositPage() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-2xl">
      <DepositPageHeader
        title={t("deposits.title")}
        subtitle={t("deposits.subtitle")}
        backTo="/dashboard/deposits"
      />

      <DashboardSheet>
<FadeIn>
        <p className="mb-4 text-sm text-muted">{t("deposits.giftCardPageDesc")}</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {GIFT_CARD_BRANDS.map((brand) => (
            <Link
              key={brand.id}
              to={`/dashboard/deposits/gift-card/${brand.id}`}
              className="rounded-xl border border-border bg-secondary/50 p-4 text-center transition-all hover:border-emerald/25 hover:bg-secondary/70"
            >
              <GiftCardBrandIcon brand={brand} />
              <span className="text-xs font-medium text-foreground">{brand.label}</span>
            </Link>
          ))}
        </div>
      </FadeIn>
      </DashboardSheet>
    </div>
  );
}
