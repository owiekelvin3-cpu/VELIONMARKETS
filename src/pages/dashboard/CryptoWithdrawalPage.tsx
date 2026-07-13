import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useWithdrawalData, useWithdrawalForm } from "@/hooks/useWithdrawals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DepositPageHeader } from "@/components/dashboard/DepositPageHeader";
import { CryptoBrandIcon } from "@/components/dashboard/DepositIcons";
import { WithdrawalHistory } from "@/components/dashboard/WithdrawalHistory";
import {
  WithdrawalBalanceBanner,
  WithdrawalFormPanel,
  WithdrawalHistoryPanel,
  WithdrawalAmountField,
  WithdrawalAlert,
  OutstandingFeesPanel,
} from "@/components/dashboard/WithdrawalUi";
import { FadeIn } from "@/components/motion/Motion";
import { CRYPTO_ASSETS } from "@/constants/deposit-assets";
import { Coins } from "@/lib/icons";
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

  const crypto = CRYPTO_ASSETS.find((c) => c.id === selected)!;

  useEffect(() => {
    if (coinParam && CRYPTO_ASSETS.some((c) => c.id === coinParam)) {
      setSelected(coinParam);
    }
  }, [coinParam]);

  useEffect(() => {
    if (user) void load(user.id);
  }, [user, load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (amt > balance) {
      setMessage(t("withdrawals.insufficientBalance"));
      return;
    }
    const ok = await submit({
      amount: amt,
      method: `crypto_${selected}`,
      wallet_address: walletAddress,
    });
    if (ok) {
      setAmount("");
      setWalletAddress("");
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <DepositPageHeader
        title={t("withdrawals.cryptoTitle")}
        subtitle={t("withdrawals.cryptoPageDesc")}
        backTo="/dashboard/withdrawals"
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

        {!hasOutstandingFees && (
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
            <Coins className="h-3.5 w-3.5 text-emerald" />
            {t("withdrawals.selectAsset")}
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {CRYPTO_ASSETS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelected(c.id)}
                className={cn(
                  "rounded-xl border p-3 text-center transition-all",
                  selected === c.id
                    ? "border-emerald/40 bg-emerald/10 ring-1 ring-emerald/20"
                    : "border-border bg-secondary/20 hover:border-emerald/20"
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="wallet">{t("withdrawals.walletAddress")}</Label>
              <Input
                id="wallet"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder={t("withdrawals.walletPlaceholder")}
                required
                className="mt-2 h-11 font-mono text-sm"
              />
            </div>

            <WithdrawalAmountField
              balance={balance}
              amount={amount}
              onChange={setAmount}
              min={10}
              hint={t("withdrawals.cryptoTiming")}
            />

            {message && <WithdrawalAlert type="error">{message}</WithdrawalAlert>}
            {success && <WithdrawalAlert type="success">{t("withdrawals.submitSuccess")}</WithdrawalAlert>}

            <Button type="submit" className="h-12 w-full text-base" disabled={loading || !amount || parseFloat(amount) > balance}>
              {loading ? t("withdrawals.submitting") : t("withdrawals.submitCrypto")}
            </Button>
          </form>
        </WithdrawalFormPanel>
        )}

        <WithdrawalHistoryPanel>
          <WithdrawalHistory withdrawals={withdrawals} />
        </WithdrawalHistoryPanel>
      </FadeIn>
    </div>
  );
}
