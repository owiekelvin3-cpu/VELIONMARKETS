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

const wireFilter = "wire_transfer" as const;

export default function WireWithdrawalPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { withdrawals, balance, load } = useWithdrawalData(wireFilter);
  const { loading, message, success, submit } = useWithdrawalForm(user?.id, load);

  const [amount, setAmount] = useState("");
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [bankName, setBankName] = useState("");
  const [iban, setIban] = useState("");
  const [swift, setSwift] = useState("");
  const [bankAddress, setBankAddress] = useState("");

  useEffect(() => {
    if (user) load(user.id);
  }, [user, load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await submit({
      amount: parseFloat(amount),
      method: "wire_transfer",
      notes: JSON.stringify({ beneficiaryName, bankName, iban, swift, bankAddress }),
    });
    if (ok) {
      setAmount("");
      setBeneficiaryName("");
      setBankName("");
      setIban("");
      setSwift("");
      setBankAddress("");
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <DepositPageHeader
        title={t("withdrawals.wireTitle")}
        subtitle={t("withdrawals.wirePageDesc")}
        backTo="/dashboard/withdrawals"
      />

      <FadeIn className="space-y-6">
        <WithdrawalBalanceBanner balance={balance} />

        <WithdrawalFormPanel title={t("withdrawals.wireFormTitle")}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="beneficiary">{t("withdrawals.beneficiaryName")}</Label>
              <Input id="beneficiary" value={beneficiaryName} onChange={(e) => setBeneficiaryName(e.target.value)} required className="mt-2 h-11" />
            </div>
            <div>
              <Label htmlFor="bankName">{t("withdrawals.bankName")}</Label>
              <Input id="bankName" value={bankName} onChange={(e) => setBankName(e.target.value)} required className="mt-2 h-11" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="iban">{t("withdrawals.iban")}</Label>
                <Input id="iban" value={iban} onChange={(e) => setIban(e.target.value)} required className="mt-2 h-11 font-mono text-sm" />
              </div>
              <div>
                <Label htmlFor="swift">{t("withdrawals.swift")}</Label>
                <Input id="swift" value={swift} onChange={(e) => setSwift(e.target.value)} required className="mt-2 h-11 font-mono text-sm" />
              </div>
            </div>
            <div>
              <Label htmlFor="bankAddress">{t("withdrawals.bankAddress")}</Label>
              <Input id="bankAddress" value={bankAddress} onChange={(e) => setBankAddress(e.target.value)} required className="mt-2 h-11" />
            </div>
            <div>
              <Label htmlFor="amount">{t("withdrawals.amountUsd")}</Label>
              <Input
                id="amount"
                type="number"
                min="100"
                step="0.01"
                max={balance}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="mt-2 h-11"
              />
              <p className="mt-1.5 text-xs text-muted">{t("withdrawals.wireProcessing")}</p>
            </div>

            {message && <p className="text-sm text-red-400">{message}</p>}
            {success && <p className="text-sm text-emerald">{t("withdrawals.submitSuccess")}</p>}

            <Button type="submit" className="h-11 w-full" disabled={loading || parseFloat(amount) > balance}>
              {loading ? t("withdrawals.submitting") : t("withdrawals.submitWire")}
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
