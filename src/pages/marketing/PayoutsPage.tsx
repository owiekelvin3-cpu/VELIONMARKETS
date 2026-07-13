import { useTranslation } from "react-i18next";
import { PageHero } from "@/components/marketing/PageHero";
import { IMAGES } from "@/constants/images";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/motion/Motion";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

const payouts = [
  { client: "J.R.", amount: 12500, date: "2026-07-05", method: "Bank Transfer" },
  { client: "S.C.", amount: 8750, date: "2026-07-04", method: "Bitcoin" },
  { client: "M.T.", amount: 22000, date: "2026-07-03", method: "Bank Transfer" },
  { client: "A.K.", amount: 5400, date: "2026-07-02", method: "Ethereum" },
  { client: "L.W.", amount: 15300, date: "2026-07-01", method: "Bank Transfer" },
];

export default function PayoutsPage() {
  const { t } = useTranslation();

  return (
    <>
      <PageHero badge={t("pages.payoutsBadge")} title={t("pages.payoutsTitle")} subtitle={t("pages.payoutsSubtitle")} image={IMAGES.pages.payouts} />
      <section className="pb-24">
        <div className="container mx-auto px-4">
          <StaggerContainer className="mx-auto max-w-2xl space-y-4">
            {payouts.map((p) => (
              <StaggerItem key={p.client}>
                <GlassCard className="flex items-center justify-between !p-5">
                  <div>
                    <p className="text-xl font-bold text-gradient-emerald">{formatCurrency(p.amount)}</p>
                    <p className="text-sm text-muted">
                      {t("pages.payoutsClient", { id: p.client })} &middot; {p.method} &middot; {formatDate(p.date)}
                    </p>
                  </div>
                  <Badge variant="success">{t("common.completed")}</Badge>
                </GlassCard>
              </StaggerItem>
            ))}
          </StaggerContainer>
          <FadeIn className="mt-8 text-center text-sm text-muted">
            {t("pages.payoutsNote")}
          </FadeIn>
        </div>
      </section>
    </>
  );
}
