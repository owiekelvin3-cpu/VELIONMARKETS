import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowDownToLine, ArrowRight, ArrowUpFromLine, TrendingUp,
} from "@/lib/icons";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { localizeTransaction, type UserTransaction } from "@/lib/transactions";
import { cn } from "@/lib/utils";

const KIND_ICONS = {
  deposit: ArrowDownToLine,
  withdrawal: ArrowUpFromLine,
  trade: TrendingUp,
} as const;

const KIND_COLORS = {
  deposit: "text-emerald",
  withdrawal: "text-amber-400",
  trade: "text-sky-400",
} as const;

function statusVariant(status: string): "success" | "warning" | "destructive" | "secondary" {
  if (status === "completed" || status === "approved") return "success";
  if (status === "rejected") return "destructive";
  if (status === "pending") return "warning";
  return "secondary";
}

interface TransactionListProps {
  items: UserTransaction[];
  compact?: boolean;
  emptyMessage?: string;
  onItemClick?: (tx: UserTransaction) => void;
  selectedId?: string | null;
}

export function TransactionList({ items, compact = false, emptyMessage, onItemClick, selectedId }: TransactionListProps) {
  const { t } = useTranslation();

  if (items.length === 0) {
    return <p className="text-sm text-muted">{emptyMessage ?? t("transactions.empty")}</p>;
  }

  return (
    <div className={cn("space-y-2", !compact && "space-y-3")}>
      {items.map((raw) => {
        const tx = localizeTransaction(raw, t);
        const Icon = KIND_ICONS[tx.kind];
        const isOutflow = tx.kind === "withdrawal" || (tx.kind === "trade" && tx.trade_type === "sell");
        const isSelected = selectedId === tx.id;
        const Wrapper = onItemClick ? "button" : "div";

        return (
          <Wrapper
            key={tx.id}
            type={onItemClick ? "button" : undefined}
            onClick={onItemClick ? () => onItemClick(raw) : undefined}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl border border-border bg-secondary/20 text-left transition-colors",
              compact ? "px-3 py-2.5" : "px-4 py-3",
              onItemClick && "group cursor-pointer hover:border-emerald/30 hover:bg-secondary/40",
              isSelected && "border-emerald/40 bg-emerald/5 ring-1 ring-emerald/20"
            )}
          >
            <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary/60", KIND_COLORS[tx.kind])}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{tx.title}</p>
              <p className="truncate text-xs text-muted">
                {tx.subtitle} · {formatDate(tx.created_at)}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className={cn("text-sm font-semibold", isOutflow ? "text-foreground" : "text-emerald")}>
                {isOutflow ? "−" : "+"}{formatCurrency(tx.amount)}
              </p>
              <Badge variant={statusVariant(tx.status)} className="mt-1 text-[10px] capitalize">
                {tx.status}
              </Badge>
              {onItemClick && (
                <p className="mt-1 text-[10px] text-emerald opacity-0 transition-opacity group-hover:opacity-100 sm:opacity-100">
                  {t("transactions.viewReceipt")}
                </p>
              )}
            </div>
          </Wrapper>
        );
      })}
    </div>
  );
}

interface RecentTransactionsCardProps {
  items: UserTransaction[];
  total: number;
  limit: number;
  onItemClick?: (tx: UserTransaction) => void;
  selectedId?: string | null;
}

export function RecentTransactionsCard({ items, total, limit, onItemClick, selectedId }: RecentTransactionsCardProps) {
  const { t } = useTranslation();
  const hasMore = total > limit;

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 className="font-display font-semibold text-foreground">{t("dashboard.recentTransactions")}</h2>
        {hasMore && (
          <Link to="/dashboard/transactions" className="flex items-center text-xs text-emerald hover:underline">
            {t("dashboard.viewAllTransactions", { count: total })}
            <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        )}
      </div>
      <div className="p-5">
        <TransactionList
          items={items}
          compact
          emptyMessage={t("dashboard.noTransactions")}
          onItemClick={onItemClick}
          selectedId={selectedId}
        />
        {!hasMore && total > 0 && (
          <Link
            to="/dashboard/transactions"
            className="mt-4 inline-flex items-center text-xs text-emerald hover:underline"
          >
            {t("dashboard.openTransactions")}
            <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        )}
      </div>
    </div>
  );
}
