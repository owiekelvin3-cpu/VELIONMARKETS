import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowDownToLine, ArrowRight, ArrowUpFromLine, TrendingUp,
} from "@/lib/icons";
import { formatCurrency, formatDate } from "@/lib/utils";
import { localizeTransaction, type UserTransaction } from "@/lib/transactions";
import { cn } from "@/lib/utils";
import { DashboardSheet } from "@/components/dashboard/DashboardSheet";

const KIND_ICONS = {
  deposit: ArrowDownToLine,
  withdrawal: ArrowUpFromLine,
  trade: TrendingUp,
} as const;

const KIND_COLORS = {
  deposit: "text-emerald bg-emerald/15",
  withdrawal: "text-amber-500 bg-amber-500/15",
  trade: "text-sky-500 bg-sky-500/15",
} as const;

const STATUS_DOT: Record<string, string> = {
  completed: "bg-emerald",
  approved: "bg-emerald",
  pending: "bg-amber-400",
  rejected: "bg-red-400",
};

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
    return <p className="px-1 py-6 text-center text-sm text-muted">{emptyMessage ?? t("transactions.empty")}</p>;
  }

  return (
    <div className={cn("divide-y divide-border/50", !compact && "space-y-0")}>
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
              "dashboard-row",
              compact ? "py-3" : "py-3.5",
              onItemClick && "cursor-pointer",
              isSelected && "bg-secondary/50"
            )}
          >
            <div className="relative">
              <div className={cn("dashboard-row-icon", KIND_COLORS[tx.kind])}>
                <Icon className="h-4 w-4" />
              </div>
              <span
                className={cn(
                  "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-card",
                  STATUS_DOT[tx.status] ?? "bg-muted"
                )}
                aria-hidden="true"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-medium text-foreground">{tx.title}</p>
              <p className="truncate text-xs text-muted">
                {tx.subtitle} · {formatDate(tx.created_at)}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className={cn("text-[15px] font-semibold tabular-nums", isOutflow ? "text-foreground" : "text-emerald")}>
                {isOutflow ? "−" : "+"}
                {formatCurrency(tx.amount)}
              </p>
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
    <DashboardSheet className="-mx-3 mt-0 rounded-t-[2rem] sm:mx-0 sm:rounded-3xl">
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="font-display text-base font-semibold text-foreground">{t("dashboard.recentTransactions")}</h2>
        <Link
          to="/dashboard/transactions"
          className="flex items-center text-xs font-medium text-muted hover:text-emerald"
        >
          {hasMore ? t("dashboard.viewAllTransactions", { count: total }) : t("dashboard.openTransactions")}
          <ArrowRight className="ml-1 h-3 w-3" />
        </Link>
      </div>
      <TransactionList
        items={items}
        compact
        emptyMessage={t("dashboard.noTransactions")}
        onItemClick={onItemClick}
        selectedId={selectedId}
      />
    </DashboardSheet>
  );
}
