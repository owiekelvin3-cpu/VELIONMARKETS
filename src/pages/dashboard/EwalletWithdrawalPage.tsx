import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useWithdrawalData, useWithdrawalForm } from "@/hooks/useWithdrawals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DepositPageHeader } from "@/components/dashboard/DepositPageHeader";
import { EwalletProviderIcon } from "@/components/dashboard/WithdrawIcons";
import { WithdrawalHistory } from "@/components/dashboard/WithdrawalHistory";
import {
  WithdrawalBalanceBanner,
  WithdrawalFormPanel,
  WithdrawalHistoryPanel,
} from "@/components/dashboard/WithdrawalUi";
import { FadeIn } from "@/components/motion/Motion";
import { EWALLET_PROVIDERS } from "@/constants/withdrawal-methods";
import { cn } from "@/lib/utils";

const ewalletFilter = "ewallet" as const;

export default function EwalletWithdrawalPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const providerParam = searchParams.get("provider");
  const validProvider = EWALLET_PROVIDERS.some((p) => p.id === providerParam) ? providerParam! : "paypal";

  const { withdrawals, balance, load } = useWithdrawalData(ewalletFilter);
  const { loading, message, success, submit } = useWithdrawalForm(user?.id, load);

  const [selected, setSelected] = useState(validProvider);
  const [amount, setAmount] = useState("");
  const [accountEmail, setAccountEmail] = useState("");

  const provider = EWALLET_PROVIDERS.find((p) => p.id === selected)!;

  useEffect(() => {
    if (providerParam && EWALLET_PROVIDERS.some((p) => p.id === providerParam)) {
      setSelected(providerParam);
    }
  }, [providerParam]);

  useEffect(() => {
    if (user) load(user.id);
  }, [user, load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await submit({
      amount: parseFloat(amount),
      method: `ewallet_${selected}`,
      wallet_address: accountEmail,
    });
    if (ok) {
      setAmount("");
      setAccountEmail("");
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <DepositPageHeader
        title={t("withdrawals.ewalletTitle")}
        subtitle={t("withdrawals.ewalletPageDesc")}
        backTo="/dashboard/withdrawals"
      />

      <FadeIn className="space-y-6">
        <WithdrawalBalanceBanner balance={balance} />

        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {EWALLET_PROVIDERS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelected(p.id)}
              className={cn(
                "rounded-xl border p-3 text-center transition-all",
                selected === p.id
                  ? "border-emerald/40 bg-emerald/10"
                  : "border-white/[0.06] bg-white/[0.02] hover:border-white/10"
              )}
            >
              <EwalletProviderIcon provider={p} selected={selected === p.id} />
              <span className="text-xs font-medium text-foreground">{p.label}</span>
            </button>
          ))}
        </div>

        <WithdrawalFormPanel description={t("withdrawals.ewalletAccount", { provider: provider.label })}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">{t("withdrawals.ewalletEmail")}</Label>
              <Input
                id="email"
                type="email"
                value={accountEmail}
                onChange={(e) => setAccountEmail(e.target.value)}
                placeholder="you@email.com"
                required
                className="mt-2 h-11"
              />
            </div>

            <div>
              <Label htmlFor="amount">{t("withdrawals.amountUsd")}</Label>
              <Input
                id="amount"
                type="number"
                min="20"
                step="0.01"
                max={balance}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="mt-2 h-11"
              />
              <p className="mt-1.5 text-xs text-muted">{t("withdrawals.ewalletProcessing")}</p>
            </div>

            {message && <p className="text-sm text-red-400">{message}</p>}
            {success && <p className="text-sm text-emerald">{t("withdrawals.submitSuccess")}</p>}

            <Button type="submit" className="h-11 w-full" disabled={loading || parseFloat(amount) > balance}>
              {loading ? t("withdrawals.submitting") : t("withdrawals.submitEwallet")}
            </Button>
          </form>
        </WithdrawalFormPanel>

        <WithdrawalHistoryPanel>
          <WithdrawalHistory withdrawals={withdrawals} />
        </WithdrawalHistoryPanel>
      </FadeIn>
    </div>
  );
}
