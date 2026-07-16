import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useWithdrawalData, useWithdrawalForm } from "@/hooks/useWithdrawals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DepositPageHeader } from "@/components/dashboard/DepositPageHeader";
import { DashboardSheet } from "@/components/dashboard/DashboardSheet";
import { KycRequiredGate } from "@/components/dashboard/KycRequiredGate";
import { ProductNotice } from "@/components/dashboard/ProductNotice";
import { EwalletProviderIcon } from "@/components/dashboard/WithdrawIcons";
import { WithdrawalHistory } from "@/components/dashboard/WithdrawalHistory";
import {
  WithdrawalBalanceBanner,
  WithdrawalFormPanel,
  WithdrawalHistoryPanel,
  WithdrawalAmountField,
  WithdrawalAlert,
  WithdrawalConfirmBar,
  OutstandingFeesPanel,
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

  const { withdrawals, balance, outstandingFees, hasOutstandingFees, load } = useWithdrawalData(ewalletFilter);
  const { loading, message, success, submit, setMessage } = useWithdrawalForm(user?.id, load, hasOutstandingFees);

  const [selected, setSelected] = useState(validProvider);
  const [amount, setAmount] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [confirming, setConfirming] = useState(false);

  const provider = EWALLET_PROVIDERS.find((p) => p.id === selected)!;
  const amt = parseFloat(amount) || 0;

  useEffect(() => {
    if (providerParam && EWALLET_PROVIDERS.some((p) => p.id === providerParam)) {
      setSelected(providerParam);
    }
  }, [providerParam]);

  useEffect(() => {
    if (user) void load(user.id);
  }, [user, load]);

  const requestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amt > balance) {
      setMessage(t("withdrawals.insufficientBalance"));
      return;
    }
    if (amt < 20 || !accountEmail.trim()) return;
    setMessage("");
    setConfirming(true);
  };

  const confirmSubmit = async () => {
    const ok = await submit({
      amount: amt,
      method: `ewallet_${selected}`,
      wallet_address: accountEmail.trim(),
    });
    if (ok) {
      setAmount("");
      setAccountEmail("");
    }
    setConfirming(false);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <DepositPageHeader
        title={t("withdrawals.ewalletTitle")}
        subtitle={t("withdrawals.ewalletPageDesc")}
        backTo="/dashboard/withdrawals"
      />

      <KycRequiredGate>
        <DashboardSheet>
          <FadeIn className="space-y-5">
            <WithdrawalBalanceBanner balance={balance} />
            <ProductNotice title={t("withdrawals.formTrustTitle")} body={t("withdrawals.ewalletTrustBody")} />

            {user && (
              <OutstandingFeesPanel
                fees={outstandingFees}
                balance={balance}
                onPaid={() => load(user.id)}
              />
            )}

            {!hasOutstandingFees && (
              <div className="rounded-2xl border border-border bg-card p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
                  {t("withdrawals.selectProvider")}
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {EWALLET_PROVIDERS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSelected(p.id);
                        setConfirming(false);
                      }}
                      className={cn(
                        "rounded-xl border p-3 text-center transition-colors",
                        selected === p.id
                          ? "border-border bg-secondary"
                          : "border-border bg-secondary/20 hover:bg-secondary/40"
                      )}
                    >
                      <EwalletProviderIcon provider={p} selected={selected === p.id} />
                      <span className="text-xs font-medium text-foreground">{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!hasOutstandingFees && (
              <WithdrawalFormPanel description={t("withdrawals.ewalletAccount", { provider: provider.label })}>
                <form onSubmit={requestSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="email">{t("withdrawals.ewalletEmail")}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={accountEmail}
                      onChange={(e) => {
                        setAccountEmail(e.target.value);
                        setConfirming(false);
                      }}
                      placeholder="you@email.com"
                      required
                      className="mt-2 h-11"
                    />
                  </div>

                  <WithdrawalAmountField
                    balance={balance}
                    amount={amount}
                    onChange={(v) => {
                      setAmount(v);
                      setConfirming(false);
                    }}
                    min={20}
                    hint={t("withdrawals.ewalletProcessing")}
                  />

                  {message && <WithdrawalAlert type="error">{message}</WithdrawalAlert>}
                  {success && (
                    <WithdrawalAlert type="success">{t("withdrawals.submitSuccess")}</WithdrawalAlert>
                  )}

                  {confirming ? (
                    <WithdrawalConfirmBar
                      amount={amt}
                      methodLabel={provider.label}
                      loading={loading}
                      onCancel={() => setConfirming(false)}
                      onConfirm={() => void confirmSubmit()}
                    />
                  ) : (
                    <Button
                      type="submit"
                      className="h-11 w-full"
                      disabled={loading || amt <= 0 || amt > balance || !accountEmail.trim()}
                    >
                      {t("withdrawals.reviewRequest")}
                    </Button>
                  )}
                </form>
              </WithdrawalFormPanel>
            )}

            <WithdrawalHistoryPanel>
              <WithdrawalHistory withdrawals={withdrawals} />
            </WithdrawalHistoryPanel>
          </FadeIn>
        </DashboardSheet>
      </KycRequiredGate>
    </div>
  );
}
