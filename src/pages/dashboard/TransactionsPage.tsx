import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/hooks/useAuth";
import { ensureValidSession } from "@/lib/auth-session";
import { TransactionList } from "@/components/dashboard/TransactionList";
import { TransactionReceiptPanel } from "@/components/dashboard/TransactionReceiptPanel";
import {
  fetchUserTransactions,
  type TransactionKind,
  type UserTransaction,
} from "@/lib/transactions";
import { cn } from "@/lib/utils";

type Filter = "all" | TransactionKind;

export default function TransactionsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<UserTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<UserTransaction | null>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        await ensureValidSession();
        const data = await fetchUserTransactions(user.id);
        setTransactions(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load transactions");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [user]);

  const filtered = useMemo(() => {
    if (filter === "all") return transactions;
    return transactions.filter((tx) => tx.kind === filter);
  }, [transactions, filter]);

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: t("transactions.filterAll") },
    { id: "deposit", label: t("transactions.filterDeposits") },
    { id: "withdrawal", label: t("transactions.filterWithdrawals") },
    { id: "trade", label: t("transactions.filterTrades") },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={t("transactions.title")} subtitle={t("transactions.subtitle")} />

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={cn(
              "rounded-xl border px-4 py-2 text-sm font-medium transition-colors",
              filter === f.id
                ? "border-emerald/40 bg-emerald/10 text-emerald"
                : "border-border bg-secondary/30 text-muted hover:border-emerald/20 hover:text-foreground"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        {loading ? (
          <p className="text-sm text-muted">{t("common.loading")}…</p>
        ) : error ? (
          <p className="text-sm text-red-400">{error}</p>
        ) : (
          <>
            <p className="mb-4 text-xs text-muted">
              {t("transactions.count", { count: filtered.length })} · {t("transactions.receipt.viewHint")}
            </p>
            <TransactionList
              items={filtered}
              onItemClick={setSelected}
              selectedId={selected?.id}
            />
          </>
        )}
      </div>

      <TransactionReceiptPanel transaction={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
