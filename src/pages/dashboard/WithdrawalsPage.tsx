import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Shield } from "@/lib/icons";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { FadeIn } from "@/components/motion/Motion";
import { DepositPageHeader } from "@/components/dashboard/DepositPageHeader";
import { DepositMethodCard } from "@/components/dashboard/DepositMethodCard";
import { WithdrawalBalanceBanner } from "@/components/dashboard/WithdrawalUi";
import { WithdrawFundsShowcase, WithdrawalProcessingTimeline } from "@/components/dashboard/WithdrawFundsShowcase";
import {
  CryptoIconGrid,
  BankWithdrawIcon,
  WireWithdrawIcon,
  EwalletIconGrid,
} from "@/components/dashboard/WithdrawIcons";

export default function WithdrawalsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("balances")
      .select("amount")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => setBalance(data?.amount ?? 0));
  }, [user]);

  return (
    <div className="mx-auto max-w-3xl">
      <DepositPageHeader
        title={t("withdrawals.title")}
        subtitle={t("withdrawals.subtitle")}
        backTo="/dashboard"
      />

      <FadeIn className="space-y-6">
        <WithdrawalBalanceBanner balance={balance} />

        <div className="grid gap-4 sm:grid-cols-2">
          <DepositMethodCard
            to="/dashboard/withdrawals/crypto"
            title={t("withdrawals.cryptoTitle")}
            description={t("withdrawals.cryptoDesc")}
            iconGrid={<CryptoIconGrid size="lg" />}
            iconRow={<CryptoIconGrid size="sm" />}
          />

          <DepositMethodCard
            to="/dashboard/withdrawals/bank"
            title={t("withdrawals.bankTitle")}
            description={t("withdrawals.bankDesc")}
            iconGrid={<BankWithdrawIcon />}
            iconRow={<BankWithdrawIcon size="sm" />}
          />

          <DepositMethodCard
            to="/dashboard/withdrawals/wire"
            title={t("withdrawals.wireTitle")}
            description={t("withdrawals.wireDesc")}
            iconGrid={<WireWithdrawIcon />}
            iconRow={<WireWithdrawIcon size="sm" />}
          />

          <DepositMethodCard
            to="/dashboard/withdrawals/ewallet"
            title={t("withdrawals.ewalletTitle")}
            description={t("withdrawals.ewalletDesc")}
            iconGrid={<EwalletIconGrid size="lg" />}
            iconRow={<EwalletIconGrid size="sm" />}
          />
        </div>

        <div className="flex gap-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald/10">
            <Shield className="h-5 w-5 text-emerald" aria-hidden="true" />
          </div>
          <p className="text-sm leading-relaxed text-muted">{t("withdrawals.securityNote")}</p>
        </div>

        <WithdrawalProcessingTimeline />

        <WithdrawFundsShowcase />
      </FadeIn>
    </div>
  );
}
