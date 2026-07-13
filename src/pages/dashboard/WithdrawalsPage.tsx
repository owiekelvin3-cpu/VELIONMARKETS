import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "@/lib/icons";
import { useAuth } from "@/hooks/useAuth";
import { useWithdrawalData } from "@/hooks/useWithdrawals";
import { FadeIn } from "@/components/motion/Motion";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import {
  WithdrawalBalanceBanner,
  WithdrawalHistoryPanel,
  WithdrawalSecurityCard,
  OutstandingFeesPanel,
} from "@/components/dashboard/WithdrawalUi";
import { WithdrawFundsShowcase, WithdrawalProcessingTimeline } from "@/components/dashboard/WithdrawFundsShowcase";
import { WithdrawalHistory } from "@/components/dashboard/WithdrawalHistory";

export default function WithdrawalsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { withdrawals, balance, outstandingFees, hasOutstandingFees, load } = useWithdrawalData();

  useEffect(() => {
    if (user) void load(user.id);
  }, [user, load]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        eyebrow={t("dashboard.navGroupCash")}
        title={t("withdrawals.title")}
        subtitle={t("withdrawals.subtitle")}
        actions={
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="h-3.5 w-3.5" />
              {t("dashboard.overview")}
            </Link>
          </Button>
        }
      />

      <FadeIn className="space-y-6">
        <WithdrawalBalanceBanner balance={balance} />

        {user && (
          <OutstandingFeesPanel
            fees={outstandingFees}
            balance={balance}
            onPaid={() => load(user.id)}
          />
        )}

        {!hasOutstandingFees && <WithdrawFundsShowcase />}

        {!hasOutstandingFees && <WithdrawalProcessingTimeline />}

        <WithdrawalSecurityCard />

        <WithdrawalHistoryPanel>
          <WithdrawalHistory withdrawals={withdrawals} />
        </WithdrawalHistoryPanel>

        <p className="pb-2 text-center text-xs text-muted">
          {t("withdrawals.needHelp")}{" "}
          <Link to="/dashboard/support" className="font-medium text-foreground hover:text-emerald">
            {t("withdrawals.contactSupport")}
          </Link>
        </p>
      </FadeIn>
    </div>
  );
}
