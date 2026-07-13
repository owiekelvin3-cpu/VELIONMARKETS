import { Badge } from "@/components/ui/badge";
import { ArrowUpFromLine, Building2, Coins, Globe2, Wallet } from "@/lib/icons";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { Withdrawal } from "@/types/database";

function methodIcon(method: string) {
  if (method.startsWith("crypto_")) return { Icon: Coins, className: "bg-emerald/10 text-emerald" };
  if (method.startsWith("ewallet_")) return { Icon: Wallet, className: "bg-amber-500/10 text-amber-400" };
  if (method === "wire_transfer") return { Icon: Globe2, className: "bg-indigo-500/10 text-indigo-400" };
  if (method === "bank_transfer") return { Icon: Building2, className: "bg-blue-500/10 text-blue-400" };
  return { Icon: ArrowUpFromLine, className: "bg-secondary text-muted" };
}

export function WithdrawalHistory({ withdrawals }: { withdrawals: Withdrawal[] }) {
  const { t } = useTranslation();

  if (withdrawals.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-secondary/20 px-4 py-12 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/60 text-muted/60">
          <ArrowUpFromLine className="h-7 w-7" />
        </div>
        <p className="mt-4 text-sm font-medium text-foreground">{t("withdrawals.noHistoryTitle")}</p>
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
            className="flex items-center gap-3 rounded-xl border border-border bg-secondary/20 px-4 py-3.5 transition-colors hover:bg-secondary/40"
          >
            <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", className)}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-foreground">{formatCurrency(w.amount)}</p>
              <p className="truncate text-xs text-muted">
                {formatMethodLabel(w.method)} · {formatDate(w.created_at)}
              </p>
            </div>
            <Badge
              variant={w.status === "completed" ? "success" : w.status === "rejected" ? "destructive" : "warning"}
              className="shrink-0 text-[10px] capitalize"
            >
              {w.status}
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
