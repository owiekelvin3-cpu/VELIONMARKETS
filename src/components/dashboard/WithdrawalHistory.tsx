import { Badge } from "@/components/ui/badge";
import { ArrowUpFromLine, Building2, Coins, Globe2, Wallet } from "@/lib/icons";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { Withdrawal } from "@/types/database";

function methodIcon(method: string) {
  if (method.startsWith("crypto_")) return { Icon: Coins, className: "bg-secondary text-muted" };
  if (method.startsWith("ewallet_")) return { Icon: Wallet, className: "bg-secondary text-muted" };
  if (method === "wire_transfer") return { Icon: Globe2, className: "bg-secondary text-muted" };
  if (method === "bank_transfer") return { Icon: Building2, className: "bg-secondary text-muted" };
  return { Icon: ArrowUpFromLine, className: "bg-secondary text-muted" };
}

function statusVariant(status: string) {
  if (status === "completed" || status === "approved") return "success" as const;
  if (status === "rejected") return "destructive" as const;
  return "warning" as const;
}

export function WithdrawalHistory({ withdrawals }: { withdrawals: Withdrawal[] }) {
  const { t } = useTranslation();

  if (withdrawals.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-secondary/50 text-muted">
          <ArrowUpFromLine className="h-5 w-5" />
        </div>
        <p className="mt-3 text-sm font-medium text-foreground">{t("withdrawals.noHistoryTitle")}</p>
        <p className="mt-1 text-xs text-muted">{t("withdrawals.noHistory")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {withdrawals.map((w) => {
        const { Icon, className } = methodIcon(w.method);
        return (
          <div
            key={w.id}
            className="flex items-center gap-3 rounded-xl border border-border bg-secondary/25 px-3.5 py-3"
          >
            <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", className)}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-foreground">{formatCurrency(w.amount)}</p>
              <p className="truncate text-xs text-muted">
                {formatMethodLabel(w.method)} · {formatDate(w.created_at)}
              </p>
            </div>
            <Badge variant={statusVariant(w.status)} className="shrink-0 text-[10px] capitalize">
              {t(`withdrawals.status.${w.status}`, { defaultValue: w.status })}
            </Badge>
          </div>
        );
      })}
    </div>
  );
}

function formatMethodLabel(method: string) {
  return method
    .replace(/^crypto_/, "")
    .replace(/^ewallet_/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
