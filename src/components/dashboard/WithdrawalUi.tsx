import { Wallet } from "@/lib/icons";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/lib/utils";

export function WithdrawalBalanceBanner({ balance }: { balance: number }) {
  const { t } = useTranslation();

  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald/20 bg-gradient-to-br from-emerald/10 via-white/[0.02] to-transparent p-5">
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-emerald/10 blur-2xl" />
      <div className="relative flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald/15 text-emerald ring-1 ring-emerald/20">
            <Wallet className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted">
              {t("withdrawals.availableBalance")}
            </p>
            <p className="mt-0.5 font-display text-2xl font-bold text-foreground">
              {formatCurrency(balance)}
            </p>
          </div>
        </div>
        <span className="hidden rounded-full border border-emerald/25 bg-emerald/10 px-3 py-1 text-xs font-medium text-emerald sm:inline">
          {t("withdrawals.readyToWithdraw")}
        </span>
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
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6">
      {title && <h2 className="font-display font-semibold text-foreground">{title}</h2>}
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      <div className={title || description ? "mt-5 space-y-4" : "space-y-4"}>{children}</div>
    </div>
  );
}

export function WithdrawalHistoryPanel({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6">
      <h2 className="mb-4 font-display font-semibold text-foreground">{t("withdrawals.recent")}</h2>
      {children}
    </div>
  );
}
