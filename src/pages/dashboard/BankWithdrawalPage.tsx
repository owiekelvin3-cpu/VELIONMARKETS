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

const bankFilter = "bank_transfer" as const;

export default function BankWithdrawalPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { withdrawals, balance, outstandingFees, hasOutstandingFees, load } = useWithdrawalData(bankFilter);
  const { loading, message, success, submit, setMessage } = useWithdrawalForm(user?.id, load, hasOutstandingFees);

  const [amount, setAmount] = useState("");
  const [accountName, setAccountName] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
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
    if (amt < 50) return;
    setMessage("");
    setConfirming(true);
  };

  const confirmSubmit = async () => {
    const ok = await submit({
      amount: amt,
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
    setConfirming(false);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <DepositPageHeader
        title={t("withdrawals.bankTitle")}
        subtitle={t("withdrawals.bankPageDesc")}
        backTo="/dashboard/withdrawals"
      />

      <KycRequiredGate>
        <DashboardSheet>
          <FadeIn className="space-y-5">
            <WithdrawalBalanceBanner balance={balance} />
            <ProductNotice title={t("withdrawals.formTrustTitle")} body={t("withdrawals.bankTrustBody")} />

            {user && (
              <OutstandingFeesPanel
                fees={outstandingFees}
                balance={balance}
                onPaid={() => load(user.id)}
              />
            )}

            {!hasOutstandingFees && (
              <WithdrawalFormPanel title={t("withdrawals.bankFormTitle")}>
                <form onSubmit={requestSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="accountName">{t("withdrawals.accountName")}</Label>
                    <Input
                      id="accountName"
                      value={accountName}
                      onChange={(e) => {
                        setAccountName(e.target.value);
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
                      <Label htmlFor="accountNumber">{t("withdrawals.accountNumber")}</Label>
                      <Input
                        id="accountNumber"
                        value={accountNumber}
                        onChange={(e) => {
                          setAccountNumber(e.target.value);
                          setConfirming(false);
                        }}
                        required
                        className="mt-2 h-11"
                      />
                    </div>
                    <div>
                      <Label htmlFor="routing">{t("withdrawals.routingNumber")}</Label>
                      <Input
                        id="routing"
                        value={routingNumber}
                        onChange={(e) => {
                          setRoutingNumber(e.target.value);
                          setConfirming(false);
                        }}
                        required
                        className="mt-2 h-11"
                      />
                    </div>
                  </div>
                  <WithdrawalAmountField
                    balance={balance}
                    amount={amount}
                    onChange={(v) => {
                      setAmount(v);
                      setConfirming(false);
                    }}
                    min={50}
                    hint={t("withdrawals.bankProcessing")}
                  />

                  {message && <WithdrawalAlert type="error">{message}</WithdrawalAlert>}
                  {success && (
                    <WithdrawalAlert type="success">{t("withdrawals.submitSuccess")}</WithdrawalAlert>
                  )}

                  {confirming ? (
                    <WithdrawalConfirmBar
                      amount={amt}
                      methodLabel={t("withdrawals.bankTitle")}
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
