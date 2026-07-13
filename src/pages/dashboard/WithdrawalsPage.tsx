import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useWithdrawalData } from "@/hooks/useWithdrawals";
import { FadeIn } from "@/components/motion/Motion";
import {
  WithdrawPageHeader,
  WithdrawalBalanceBanner,
  WithdrawalHistoryPanel,
  WithdrawalSecurityCard,
} from "@/components/dashboard/WithdrawalUi";
import { WithdrawFundsShowcase, WithdrawalProcessingTimeline } from "@/components/dashboard/WithdrawFundsShowcase";
import { WithdrawalHistory } from "@/components/dashboard/WithdrawalHistory";

export default function WithdrawalsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { withdrawals, balance, load } = useWithdrawalData();

  useEffect(() => {
    if (user) void load(user.id);
  }, [user, load]);

  return (
    <div className="mx-auto max-w-4xl">
      <WithdrawPageHeader
        title={t("withdrawals.title")}
        subtitle={t("withdrawals.subtitle")}
        backTo="/dashboard"
      />

      <FadeIn className="space-y-8">
        <WithdrawalBalanceBanner balance={balance} />

        <WithdrawFundsShowcase />

        <WithdrawalProcessingTimeline />

        <WithdrawalSecurityCard />

        <WithdrawalHistoryPanel>
          <WithdrawalHistory withdrawals={withdrawals} />
        </WithdrawalHistoryPanel>

        <p className="pb-4 text-center text-xs text-muted">
          {t("withdrawals.needHelp")}{" "}
          <Link to="/dashboard/settings" className="font-medium text-emerald hover:underline">
            {t("withdrawals.contactSupport")}
          </Link>
        </p>
      </FadeIn>
    </div>
  );
}
