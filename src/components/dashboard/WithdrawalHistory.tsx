import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import type { Withdrawal } from "@/types/database";

export function WithdrawalHistory({ withdrawals }: { withdrawals: Withdrawal[] }) {
  const { t } = useTranslation();

  if (withdrawals.length === 0) {
    return <p className="text-sm text-muted">{t("withdrawals.noHistory")}</p>;
  }

  return (
    <div className="space-y-3">
      {withdrawals.map((w) => (
        <div
          key={w.id}
          className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3 text-sm"
        >
          <div>
            <p className="font-medium text-foreground">{formatCurrency(w.amount)}</p>
            <p className="text-xs text-muted">
              {formatMethodLabel(w.method)} · {formatDate(w.created_at)}
            </p>
          </div>
          <Badge variant={w.status === "completed" ? "success" : "warning"}>{w.status}</Badge>
        </div>
      ))}
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
