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

  const { withdrawals, balance, load } = useWithdrawalData(cryptoFilter);
  const { loading, message, success, submit, setMessage } = useWithdrawalForm(user?.id, load);

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
    if (user) load(user.id);
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

        <div className="grid grid-cols-4 gap-2 sm:grid-cols-4">
          {CRYPTO_ASSETS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelected(c.id)}
              className={cn(
                "rounded-xl border p-3 text-center transition-all",
                selected === c.id
                  ? "border-emerald/40 bg-emerald/10"
                  : "border-white/[0.06] bg-white/[0.02] hover:border-white/10"
              )}
            >
              <CryptoBrandIcon asset={c} selected={selected === c.id} />
              <span className="text-xs font-medium text-foreground">{c.symbol}</span>
            </button>
          ))}
        </div>

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

            <div>
              <Label htmlFor="amount">{t("withdrawals.amountUsd")}</Label>
              <Input
                id="amount"
                type="number"
                min="10"
                step="0.01"
                max={balance}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="mt-2 h-11"
              />
            </div>

            {message && <p className="text-sm text-red-400">{message}</p>}
            {success && <p className="text-sm text-emerald">{t("withdrawals.submitSuccess")}</p>}

            <Button type="submit" className="h-11 w-full" disabled={loading || parseFloat(amount) > balance}>
              {loading ? t("withdrawals.submitting") : t("withdrawals.submitCrypto")}
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
