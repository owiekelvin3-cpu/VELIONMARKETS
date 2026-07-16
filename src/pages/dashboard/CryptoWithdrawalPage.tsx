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
import { CryptoBrandIcon } from "@/components/dashboard/DepositIcons";
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
import { CRYPTO_ASSETS } from "@/constants/deposit-assets";
import { cn } from "@/lib/utils";

const cryptoFilter = "crypto" as const;

export default function CryptoWithdrawalPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const coinParam = searchParams.get("coin");
  const validCoin = CRYPTO_ASSETS.some((c) => c.id === coinParam) ? coinParam! : "bitcoin";

  const { withdrawals, balance, outstandingFees, hasOutstandingFees, load } = useWithdrawalData(cryptoFilter);
  const { loading, message, success, submit, setMessage } = useWithdrawalForm(user?.id, load, hasOutstandingFees);

  const [selected, setSelected] = useState(validCoin);
  const [amount, setAmount] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [confirming, setConfirming] = useState(false);

  const crypto = CRYPTO_ASSETS.find((c) => c.id === selected)!;
  const amt = parseFloat(amount) || 0;

  useEffect(() => {
    if (coinParam && CRYPTO_ASSETS.some((c) => c.id === coinParam)) {
      setSelected(coinParam);
    }
  }, [coinParam]);

  useEffect(() => {
    if (user) void load(user.id);
  }, [user, load]);

  const requestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amt > balance) {
      setMessage(t("withdrawals.insufficientBalance"));
      return;
    }
    if (amt < 10 || !walletAddress.trim()) return;
    setMessage("");
    setConfirming(true);
  };

  const confirmSubmit = async () => {
    const ok = await submit({
      amount: amt,
      method: `crypto_${selected}`,
      wallet_address: walletAddress.trim(),
    });
    if (ok) {
      setAmount("");
      setWalletAddress("");
    }
    setConfirming(false);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <DepositPageHeader
        title={t("withdrawals.cryptoTitle")}
        subtitle={t("withdrawals.cryptoPageDesc")}
        backTo="/dashboard/withdrawals"
      />

      <KycRequiredGate>
        <DashboardSheet>
          <FadeIn className="space-y-5">
            <WithdrawalBalanceBanner balance={balance} />
            <ProductNotice title={t("withdrawals.formTrustTitle")} body={t("withdrawals.cryptoTrustBody")} />

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
                  {t("withdrawals.selectAsset")}
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {CRYPTO_ASSETS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setSelected(c.id);
                        setConfirming(false);
                      }}
                      className={cn(
                        "rounded-xl border p-3 text-center transition-colors",
                        selected === c.id
                          ? "border-border bg-secondary"
                          : "border-border bg-secondary/20 hover:bg-secondary/40"
                      )}
                    >
                      <CryptoBrandIcon asset={c} selected={selected === c.id} />
                      <span className="mt-1 block text-xs font-medium text-foreground">{c.symbol}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!hasOutstandingFees && (
              <WithdrawalFormPanel description={t("withdrawals.sendCryptoTo", { asset: crypto.label })}>
                <form onSubmit={requestSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="wallet">{t("withdrawals.walletAddress")}</Label>
                    <Input
                      id="wallet"
                      value={walletAddress}
                      onChange={(e) => {
                        setWalletAddress(e.target.value);
                        setConfirming(false);
                      }}
                      placeholder={t("withdrawals.walletPlaceholder")}
                      required
                      className="mt-2 h-11 font-mono text-sm"
                    />
                    <p className="mt-1.5 text-xs text-muted">{t("withdrawals.walletHint")}</p>
                  </div>

                  <WithdrawalAmountField
                    balance={balance}
                    amount={amount}
                    onChange={(v) => {
                      setAmount(v);
                      setConfirming(false);
                    }}
                    min={10}
                    hint={t("withdrawals.cryptoTiming")}
                  />

                  {message && <WithdrawalAlert type="error">{message}</WithdrawalAlert>}
                  {success && (
                    <WithdrawalAlert type="success">{t("withdrawals.submitSuccess")}</WithdrawalAlert>
                  )}

                  {confirming ? (
                    <WithdrawalConfirmBar
                      amount={amt}
                      methodLabel={`${crypto.label} wallet`}
                      loading={loading}
                      onCancel={() => setConfirming(false)}
                      onConfirm={() => void confirmSubmit()}
                    />
                  ) : (
                    <Button
                      type="submit"
                      className="h-11 w-full"
                      disabled={loading || amt <= 0 || amt > balance || !walletAddress.trim()}
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
