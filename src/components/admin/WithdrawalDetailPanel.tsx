import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Coins, Plus } from "@/lib/icons";
import { assignUserFee } from "@/lib/admin-api";
import { FEE_TYPES, type FeeTypeId } from "@/constants/fee-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Withdrawal } from "@/types/database";

export type AdminWithdrawal = Withdrawal & {
  profiles?: { email: string | null; full_name: string | null } | null;
};

interface WithdrawalDetailPanelProps {
  withdrawal: AdminWithdrawal;
  onFeeAssigned?: () => void;
}

export function WithdrawalDetailPanel({ withdrawal, onFeeAssigned }: WithdrawalDetailPanelProps) {
  const { t } = useTranslation();
  const [feeType, setFeeType] = useState<FeeTypeId>("liquidity");
  const [customLabel, setCustomLabel] = useState("");
  const [feeAmount, setFeeAmount] = useState("");
  const [feeNotes, setFeeNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const selectedFeeMeta = FEE_TYPES.find((f) => f.id === feeType)!;
  const userLabel =
    withdrawal.profiles?.full_name ||
    withdrawal.profiles?.email ||
    withdrawal.user_id.slice(0, 8);

  const handleAssignFee = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(feeAmount);
    if (!amount || amount <= 0) {
      setError(t("admin.userDetail.feeInvalidAmount"));
      setMessage("");
      return;
    }
    const label = feeType === "custom" ? customLabel.trim() : selectedFeeMeta.label;
    if (!label) {
      setError(t("admin.userDetail.feeLabelRequired"));
      setMessage("");
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");
    try {
      await assignUserFee({
        userId: withdrawal.user_id,
        feeType,
        label,
        amount,
        notes: feeNotes.trim() || undefined,
      });
      setFeeAmount("");
      setFeeNotes("");
      setCustomLabel("");
      setMessage(t("admin.userDetail.feeAssigned"));
      onFeeAssigned?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.userDetail.feeAssignFailed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4 border-t border-border bg-secondary/20 px-4 py-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <DetailRow label={t("admin.user")} value={userLabel} />
        <DetailRow label={t("admin.email")} value={withdrawal.profiles?.email || "—"} />
        <DetailRow label={t("admin.amount")} value={formatCurrency(withdrawal.amount)} />
        <DetailRow label={t("admin.method")} value={withdrawal.method} />
        <DetailRow
          label={t("admin.destination")}
          value={withdrawal.wallet_address || "—"}
          mono
        />
        <DetailRow label={t("admin.date")} value={formatDate(withdrawal.created_at)} />
        {withdrawal.notes && (
          <div className="sm:col-span-2">
            <DetailRow label={t("admin.notes")} value={withdrawal.notes} />
          </div>
        )}
      </div>

      <section className="rounded-xl border border-border bg-card p-4">
        <h3 className="mb-1 flex items-center gap-2 font-display text-sm font-semibold text-foreground">
          <Coins className="h-4 w-4 text-emerald" />
          {t("admin.withdrawalAssignFee")}
        </h3>
        <p className="mb-4 text-xs leading-relaxed text-muted">
          {t("admin.withdrawalAssignFeeDesc", { name: userLabel })}
        </p>

        {error && (
          <p className="mb-3 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-400">
            {error}
          </p>
        )}
        {message && (
          <p className="mb-3 rounded-lg border border-emerald/30 bg-emerald/10 px-3 py-2 text-xs text-emerald">
            {message}
          </p>
        )}

        <form onSubmit={handleAssignFee} className="space-y-3">
          <div>
            <Label htmlFor={`fee-type-${withdrawal.id}`}>{t("admin.userDetail.feeType")}</Label>
            <select
              id={`fee-type-${withdrawal.id}`}
              value={feeType}
              onChange={(e) => setFeeType(e.target.value as FeeTypeId)}
              className="mt-1.5 flex h-10 w-full rounded-xl border border-border bg-void px-3 text-sm text-foreground"
            >
              {FEE_TYPES.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {t(opt.i18nKey, { defaultValue: opt.label })}
                </option>
              ))}
            </select>
          </div>
          {feeType === "custom" && (
            <div>
              <Label htmlFor={`fee-label-${withdrawal.id}`}>{t("admin.userDetail.feeCustomLabel")}</Label>
              <Input
                id={`fee-label-${withdrawal.id}`}
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                className="mt-1.5"
                placeholder={t("admin.userDetail.feeCustomPlaceholder")}
                required
              />
            </div>
          )}
          <div>
            <Label htmlFor={`fee-amount-${withdrawal.id}`}>{t("admin.userDetail.feeAmount")}</Label>
            <Input
              id={`fee-amount-${withdrawal.id}`}
              type="number"
              min="0.01"
              step="0.01"
              value={feeAmount}
              onChange={(e) => setFeeAmount(e.target.value)}
              className="mt-1.5"
              placeholder="0.00"
              required
            />
          </div>
          <div>
            <Label htmlFor={`fee-notes-${withdrawal.id}`}>{t("admin.notes")}</Label>
            <Input
              id={`fee-notes-${withdrawal.id}`}
              value={feeNotes}
              onChange={(e) => setFeeNotes(e.target.value)}
              className="mt-1.5"
              placeholder={t("admin.userDetail.feeNotesPlaceholder")}
            />
          </div>
          <Button type="submit" size="sm" variant="gold" disabled={busy} className="w-full sm:w-auto">
            <Plus className="mr-2 h-3.5 w-3.5" />
            {busy ? t("admin.userDetail.assigningFee") : t("admin.userDetail.assignFee")}
          </Button>
        </form>
      </section>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className={`mt-1 break-all text-sm text-foreground ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </p>
    </div>
  );
}
