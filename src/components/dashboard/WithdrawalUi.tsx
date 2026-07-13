import { Link } from "react-router-dom";
import {
  Wallet, ArrowDownToLine, ArrowUpFromLine, ArrowLeft, Shield, Clock, CheckCircle,
} from "@/lib/icons";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { FadeIn } from "@/components/motion/Motion";

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
    <FadeIn className="mb-8">
      <Link
        to={backTo}
        className="mb-5 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-secondary/40">
          <ArrowLeft className="h-4 w-4" />
        </span>
        Back
      </Link>
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald to-emerald/70 text-white shadow-lg shadow-emerald/20">
          <ArrowUpFromLine className="h-7 w-7" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">{title}</h1>
          {subtitle && <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-muted">{subtitle}</p>}
        </div>
      </div>
    </FadeIn>
  );
}

export function WithdrawalBalanceBanner({ balance }: { balance: number }) {
  const { t } = useTranslation();

  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald/25 bg-gradient-to-br from-emerald/15 via-card to-card p-6">
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-8 left-1/3 h-24 w-24 rounded-full bg-emerald/10 blur-2xl" />

      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald/20 to-emerald/5 text-emerald ring-1 ring-emerald/25">
            <Wallet className="h-7 w-7" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald/80">
              {t("withdrawals.availableBalance")}
            </p>
            <p className="mt-1 font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              {formatCurrency(balance)}
            </p>
          </div>
        </div>

        {balance > 0 ? (
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald/30 bg-emerald/10 px-3 py-1.5 text-xs font-medium text-emerald">
              <CheckCircle className="h-3.5 w-3.5" />
              {t("withdrawals.readyToWithdraw")}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/60 px-3 py-1.5 text-xs text-muted">
              <Clock className="h-3.5 w-3.5" />
              {t("withdrawals.manualReview")}
            </span>
          </div>
        ) : (
          <Button asChild className="w-fit shadow-lg shadow-emerald/10">
            <Link to="/dashboard/deposits">
              <ArrowDownToLine className="mr-2 h-4 w-4" />
              {t("withdrawals.addFunds")}
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}

export function WithdrawalSecurityCard() {
  const { t } = useTranslation();

  return (
    <div className="relative overflow-hidden rounded-2xl border border-dashed border-emerald/20 bg-emerald/[0.03] p-5">
      <div className="flex gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald/10 text-emerald">
          <Shield className="h-6 w-6" aria-hidden="true" />
        </div>
        <div className="space-y-2 text-sm leading-relaxed text-muted">
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
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      {title && <h2 className="font-display text-lg font-semibold text-foreground">{title}</h2>}
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      <div className={title || description ? "mt-5 space-y-4" : "space-y-4"}>{children}</div>
    </div>
  );
}

export function WithdrawalHistoryPanel({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <Clock className="h-4 w-4 text-muted" />
        <h2 className="font-display text-lg font-semibold text-foreground">{t("withdrawals.recent")}</h2>
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
