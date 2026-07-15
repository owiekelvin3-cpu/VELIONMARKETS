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
  WithdrawalAmountField,
  WithdrawalAlert,
  OutstandingFeesPanel,
} from "@/components/dashboard/WithdrawalUi";
import { FadeIn } from "@/components/motion/Motion";

const wireFilter = "wire_transfer" as const;

export default function WireWithdrawalPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { withdrawals, balance, outstandingFees, hasOutstandingFees, load } = useWithdrawalData(wireFilter);
  const { loading, message, success, submit } = useWithdrawalForm(user?.id, load, hasOutstandingFees);

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

        {user && (
          <OutstandingFeesPanel
            fees={outstandingFees}
            balance={balance}
            onPaid={() => load(user.id)}
          />
        )}

        {!hasOutstandingFees && (
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
                <Input id="iban" value={iban} onChange={(e) => setIban(e.target.value)} required className="mt-2 h-11 font-mono text-base" />
              </div>
              <div>
                <Label htmlFor="swift">{t("withdrawals.swift")}</Label>
                <Input id="swift" value={swift} onChange={(e) => setSwift(e.target.value)} required className="mt-2 h-11 font-mono text-base" />
              </div>
            </div>
            <div>
              <Label htmlFor="bankAddress">{t("withdrawals.bankAddress")}</Label>
              <Input id="bankAddress" value={bankAddress} onChange={(e) => setBankAddress(e.target.value)} required className="mt-2 h-11" />
            </div>
            <WithdrawalAmountField
              balance={balance}
              amount={amount}
              onChange={setAmount}
              min={100}
              hint={t("withdrawals.wireProcessing")}
            />

            {message && <WithdrawalAlert type="error">{message}</WithdrawalAlert>}
            {success && <WithdrawalAlert type="success">{t("withdrawals.submitSuccess")}</WithdrawalAlert>}

            <Button type="submit" className="h-12 w-full text-base" disabled={loading || !amount || parseFloat(amount) > balance}>
              {loading ? t("withdrawals.submitting") : t("withdrawals.submitWire")}
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
