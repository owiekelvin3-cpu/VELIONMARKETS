import { useEffect, useState } from "react";
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

const wireFilter = "wire_transfer" as const;

export default function WireWithdrawalPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { withdrawals, balance, outstandingFees, hasOutstandingFees, load } = useWithdrawalData(wireFilter);
  const { loading, message, success, submit, setMessage } = useWithdrawalForm(user?.id, load, hasOutstandingFees);

  const [amount, setAmount] = useState("");
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [bankName, setBankName] = useState("");
  const [iban, setIban] = useState("");
  const [swift, setSwift] = useState("");
  const [bankAddress, setBankAddress] = useState("");
  const [confirming, setConfirming] = useState(false);

  const amt = parseFloat(amount) || 0;

  useEffect(() => {
    if (user) void load(user.id);
  }, [user, load]);

  const requestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amt > balance) {
      setMessage(t("withdrawals.insufficientBalance"));
      return;
    }
    if (amt < 100) return;
    setMessage("");
    setConfirming(true);
  };

  const confirmSubmit = async () => {
    const ok = await submit({
      amount: amt,
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
    setConfirming(false);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <DepositPageHeader
        title={t("withdrawals.wireTitle")}
        subtitle={t("withdrawals.wirePageDesc")}
        backTo="/dashboard/withdrawals"
      />

      <KycRequiredGate>
        <DashboardSheet>
          <FadeIn className="space-y-5">
            <WithdrawalBalanceBanner balance={balance} />
            <ProductNotice title={t("withdrawals.formTrustTitle")} body={t("withdrawals.wireTrustBody")} />

            {user && (
              <OutstandingFeesPanel
                fees={outstandingFees}
                balance={balance}
                onPaid={() => load(user.id)}
              />
            )}

            {!hasOutstandingFees && (
              <WithdrawalFormPanel title={t("withdrawals.wireFormTitle")}>
                <form onSubmit={requestSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="beneficiary">{t("withdrawals.beneficiaryName")}</Label>
                    <Input
                      id="beneficiary"
                      value={beneficiaryName}
                      onChange={(e) => {
                        setBeneficiaryName(e.target.value);
                        setConfirming(false);
                      }}
                      required
                      className="mt-2 h-11"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bankName">{t("withdrawals.bankName")}</Label>
                    <Input
                      id="bankName"
                      value={bankName}
                      onChange={(e) => {
                        setBankName(e.target.value);
                        setConfirming(false);
                      }}
                      required
                      className="mt-2 h-11"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="iban">{t("withdrawals.iban")}</Label>
                      <Input
                        id="iban"
                        value={iban}
                        onChange={(e) => {
                          setIban(e.target.value);
                          setConfirming(false);
                        }}
                        required
                        className="mt-2 h-11 font-mono text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="swift">{t("withdrawals.swift")}</Label>
                      <Input
                        id="swift"
                        value={swift}
                        onChange={(e) => {
                          setSwift(e.target.value);
                          setConfirming(false);
                        }}
                        required
                        className="mt-2 h-11 font-mono text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="bankAddress">{t("withdrawals.bankAddress")}</Label>
                    <Input
                      id="bankAddress"
                      value={bankAddress}
                      onChange={(e) => {
                        setBankAddress(e.target.value);
                        setConfirming(false);
                      }}
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
                    min={100}
                    hint={t("withdrawals.wireProcessing")}
                  />

                  {message && <WithdrawalAlert type="error">{message}</WithdrawalAlert>}
                  {success && (
                    <WithdrawalAlert type="success">{t("withdrawals.submitSuccess")}</WithdrawalAlert>
                  )}

                  {confirming ? (
                    <WithdrawalConfirmBar
                      amount={amt}
                      methodLabel={t("withdrawals.wireTitle")}
                      loading={loading}
                      onCancel={() => setConfirming(false)}
                      onConfirm={() => void confirmSubmit()}
                    />
                  ) : (
                    <Button type="submit" className="h-11 w-full" disabled={loading || amt <= 0 || amt > balance}>
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
