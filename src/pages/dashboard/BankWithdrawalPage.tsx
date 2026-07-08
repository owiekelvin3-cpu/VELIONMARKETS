import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useWithdrawalData, useWithdrawalForm } from "@/hooks/useWithdrawals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DepositPageHeader } from "@/components/dashboard/DepositPageHeader";
import { WithdrawalHistory } from "@/components/dashboard/WithdrawalHistory";
import {
  WithdrawalBalanceBanner,
  WithdrawalFormPanel,
  WithdrawalHistoryPanel,
} from "@/components/dashboard/WithdrawalUi";
import { FadeIn } from "@/components/motion/Motion";

const bankFilter = "bank_transfer" as const;

export default function BankWithdrawalPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { withdrawals, balance, load } = useWithdrawalData(bankFilter);
  const { loading, message, success, submit } = useWithdrawalForm(user?.id, load);

  const [amount, setAmount] = useState("");
  const [accountName, setAccountName] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");

  useEffect(() => {
    if (user) load(user.id);
  }, [user, load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await submit({
      amount: parseFloat(amount),
      method: "bank_transfer",
      notes: JSON.stringify({ accountName, bankName, accountNumber, routingNumber }),
    });
    if (ok) {
      setAmount("");
      setAccountName("");
      setBankName("");
      setAccountNumber("");
      setRoutingNumber("");
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <DepositPageHeader
        title={t("withdrawals.bankTitle")}
        subtitle={t("withdrawals.bankPageDesc")}
        backTo="/dashboard/withdrawals"
      />

      <FadeIn className="space-y-6">
        <WithdrawalBalanceBanner balance={balance} />

        <WithdrawalFormPanel title={t("withdrawals.bankFormTitle")}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="accountName">{t("withdrawals.accountName")}</Label>
              <Input id="accountName" value={accountName} onChange={(e) => setAccountName(e.target.value)} required className="mt-2 h-11" />
            </div>
            <div>
              <Label htmlFor="bankName">{t("withdrawals.bankName")}</Label>
              <Input id="bankName" value={bankName} onChange={(e) => setBankName(e.target.value)} required className="mt-2 h-11" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="accountNumber">{t("withdrawals.accountNumber")}</Label>
                <Input id="accountNumber" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} required className="mt-2 h-11" />
              </div>
              <div>
                <Label htmlFor="routing">{t("withdrawals.routingNumber")}</Label>
                <Input id="routing" value={routingNumber} onChange={(e) => setRoutingNumber(e.target.value)} required className="mt-2 h-11" />
              </div>
            </div>
            <div>
              <Label htmlFor="amount">{t("withdrawals.amountUsd")}</Label>
              <Input
                id="amount"
                type="number"
                min="50"
                step="0.01"
                max={balance}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="mt-2 h-11"
              />
              <p className="mt-1.5 text-xs text-muted">{t("withdrawals.bankProcessing")}</p>
            </div>

            {message && <p className="text-sm text-red-400">{message}</p>}
            {success && <p className="text-sm text-emerald">{t("withdrawals.submitSuccess")}</p>}

            <Button type="submit" className="h-11 w-full" disabled={loading || parseFloat(amount) > balance}>
              {loading ? t("withdrawals.submitting") : t("withdrawals.submitBank")}
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
