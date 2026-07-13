import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Wallet, ArrowDownToLine, ArrowLeft, Shield, Clock, CheckCircle, AlertTriangle, Coins,
} from "@/lib/icons";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { FadeIn } from "@/components/motion/Motion";
import { payAllOutstandingFees, payUserFee } from "@/lib/fees";
import type { UserFee } from "@/types/database";

export function WithdrawPageHeader({
  title,
  subtitle,
  backTo = "/dashboard",
}: {
  title: string;
  subtitle?: string;
  backTo?: string;
}) {
  return (
    <FadeIn className="mb-6 sm:mb-8">
      <Link
        to={backTo}
        className="mb-4 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-secondary/40">
          <ArrowLeft className="h-4 w-4" />
        </span>
        Back
      </Link>
      <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
      {subtitle && <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-muted">{subtitle}</p>}
    </FadeIn>
  );
}

export function WithdrawalBalanceBanner({ balance }: { balance: number }) {
  const { t } = useTranslation();

  return (
    <div className="surface-panel p-5 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-secondary/50 text-muted">
            <Wallet className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              {t("withdrawals.availableBalance")}
            </p>
            <p className="mt-0.5 font-display text-3xl font-semibold tracking-tight text-foreground">
              {formatCurrency(balance)}
            </p>
          </div>
        </div>

        {balance > 0 ? (
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary/40 px-2.5 py-1 text-xs text-muted">
              <CheckCircle className="h-3.5 w-3.5 text-emerald" />
              {t("withdrawals.readyToWithdraw")}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary/40 px-2.5 py-1 text-xs text-muted">
              <Clock className="h-3.5 w-3.5" />
              {t("withdrawals.manualReview")}
            </span>
          </div>
        ) : (
          <Button asChild size="sm">
            <Link to="/dashboard/deposits">
              <ArrowDownToLine className="h-4 w-4" />
              {t("withdrawals.addFunds")}
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}

export function OutstandingFeesPanel({
  fees,
  balance,
  onPaid,
}: {
  fees: UserFee[];
  balance: number;
  onPaid: () => void | Promise<void>;
}) {
  const { t } = useTranslation();
  const [busyId, setBusyId] = useState<string | "all" | null>(null);
  const [error, setError] = useState("");
  const total = fees.reduce((sum, f) => sum + Number(f.amount), 0);

  if (fees.length === 0) return null;

  const payOne = async (feeId: string) => {
    setBusyId(feeId);
    setError("");
    try {
      await payUserFee(feeId);
      await onPaid();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("withdrawals.feePayFailed"));
    } finally {
      setBusyId(null);
    }
  };

  const payAll = async () => {
    setBusyId("all");
    setError("");
    try {
      await payAllOutstandingFees(fees);
      await onPaid();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("withdrawals.feePayFailed"));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-base font-semibold text-foreground">
            {t("withdrawals.feesRequiredTitle")}
          </h2>
          <p className="mt-1 text-sm text-muted">{t("withdrawals.feesRequiredDesc")}</p>
          <p className="mt-2 text-sm font-medium text-amber-300">
            {t("withdrawals.feesOutstandingTotal", { amount: formatCurrency(total) })}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {fees.map((fee) => (
          <div
            key={fee.id}
            className="flex flex-col gap-3 rounded-lg border border-border bg-secondary/40 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Coins className="h-3.5 w-3.5 text-muted" />
                {fee.label}
              </p>
              {fee.notes && <p className="mt-1 text-xs text-muted">{fee.notes}</p>}
            </div>
            <div className="flex items-center gap-3">
              <span className="font-semibold text-foreground">{formatCurrency(Number(fee.amount))}</span>
              <Button
                type="button"
                size="sm"
                disabled={busyId !== null || balance < Number(fee.amount)}
                onClick={() => void payOne(fee.id)}
              >
                {busyId === fee.id ? t("withdrawals.payingFee") : t("withdrawals.payFee")}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <p className="mt-3 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted">
          {balance < total
            ? t("withdrawals.feesNeedDeposit")
            : t("withdrawals.feesPayHint")}
        </p>
        <div className="flex flex-wrap gap-2">
          {balance < total && (
            <Button asChild size="sm" variant="outline">
              <Link to="/dashboard/deposits">{t("withdrawals.addFunds")}</Link>
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            variant="gold"
            disabled={busyId !== null || balance < total}
            onClick={() => void payAll()}
          >
            {busyId === "all" ? t("withdrawals.payingFee") : t("withdrawals.payAllFees")}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function WithdrawalSecurityCard() {
  const { t } = useTranslation();

  return (
    <div className="surface-muted p-4 md:p-5">
      <div className="flex gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted">
          <Shield className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="space-y-1.5 text-sm leading-relaxed text-muted">
          <p className="font-medium text-foreground">{t("withdrawals.secureTitle")}</p>
          <p>{t("withdrawals.securityNote")}</p>
          <p>{t("withdrawals.processingNote")}</p>
        </div>
      </div>
    </div>
  );
}

export function WithdrawalFormPanel({
  title,
  description,
  children,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="surface-panel p-5 sm:p-6">
      {title && <h2 className="font-display text-base font-semibold text-foreground">{title}</h2>}
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      <div className={title || description ? "mt-5 space-y-4" : "space-y-4"}>{children}</div>
    </div>
  );
}

export function WithdrawalHistoryPanel({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();

  return (
    <div className="surface-panel p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <Clock className="h-4 w-4 text-muted" />
        <h2 className="font-display text-base font-semibold text-foreground">{t("withdrawals.recent")}</h2>
      </div>
      {children}
    </div>
  );
}

export function WithdrawalAlert({
  type,
  children,
}: {
  type: "error" | "success";
  children: React.ReactNode;
}) {
  return (
    <p className={cn(
      "flex items-center gap-2 rounded-xl border px-4 py-3 text-sm",
      type === "success"
        ? "border-emerald/30 bg-emerald/10 text-emerald"
        : "border-red-500/30 bg-red-500/10 text-red-400"
    )}>
      {type === "success" ? <CheckCircle className="h-4 w-4 shrink-0" /> : null}
      {children}
    </p>
  );
}

interface WithdrawalAmountFieldProps {
  id?: string;
  balance: number;
  amount: string;
  onChange: (value: string) => void;
  min?: number;
  hint?: string;
}

export function WithdrawalAmountField({
  id = "amount",
  balance,
  amount,
  onChange,
  min = 10,
  hint,
}: WithdrawalAmountFieldProps) {
  const { t } = useTranslation();

  const presets = [
    { label: "25%", pct: 0.25 },
    { label: "50%", pct: 0.5 },
    { label: t("withdrawals.max"), pct: 1 },
  ];

  return (
    <div className="rounded-xl border border-border bg-secondary/20 p-4">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id} className="text-sm font-medium">{t("withdrawals.amountUsd")}</Label>
        <span className="text-xs text-muted">
          {formatCurrency(balance)} {t("withdrawals.availableShort")}
        </span>
      </div>
      <div className="relative mt-2">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-muted">$</span>
        <Input
          id={id}
          type="number"
          min={min}
          step="0.01"
          max={balance}
          value={amount}
          onChange={(e) => onChange(e.target.value)}
          required
          className="h-14 pl-8 text-xl font-bold"
        />
      </div>
      {balance > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {presets.map(({ label, pct }) => {
            const val = pct === 1 ? balance : Math.floor(balance * pct * 100) / 100;
            if (val < min) return null;
            return (
              <button
                key={label}
                type="button"
                onClick={() => onChange(val.toString())}
                className={cn(
                  "rounded-xl border py-2.5 text-center text-sm transition-all",
                  amount === val.toString()
                    ? "border-emerald/50 bg-emerald/15 text-emerald shadow-sm"
                    : "border-border bg-card text-muted hover:border-emerald/25 hover:text-foreground"
                )}
              >
                <span className="block text-[10px] uppercase tracking-wider opacity-70">{label}</span>
                <span className="font-semibold">{formatCurrency(val)}</span>
              </button>
            );
          })}
        </div>
      )}
      {hint && <p className="mt-3 flex items-center gap-1.5 text-xs text-muted"><Clock className="h-3 w-3" />{hint}</p>}
    </div>
  );
}
