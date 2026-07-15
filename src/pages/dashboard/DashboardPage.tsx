import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { StaggerContainer, StaggerItem } from "@/components/motion/Motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { formatAuthError, withValidSession } from "@/lib/auth-session";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { cn, formatCurrency } from "@/lib/utils";
import {
  ArrowDownToLine, ArrowUpFromLine, TrendingUp, Wallet,
  ShieldCheck, Bot, CandlestickChart,
} from "@/lib/icons";
import { RecentTransactionsCard } from "@/components/dashboard/TransactionList";
import { TransactionReceiptPanel } from "@/components/dashboard/TransactionReceiptPanel";
import {
  fetchUserTransactions,
  OVERVIEW_TRANSACTION_LIMIT,
  type UserTransaction,
} from "@/lib/transactions";
import type { Deposit } from "@/types/database";

const KYC_LABELS: Record<string, string> = {
  none: "dashboard.kycNone",
  pending: "dashboard.kycPending",
  approved: "dashboard.verified",
  rejected: "dashboard.kycRejected",
};

const KYC_STYLES: Record<string, string> = {
  none: "border-border bg-secondary/50 text-muted",
  pending: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300",
  approved: "border-emerald/30 bg-emerald/10 text-emerald",
  rejected: "border-red-500/30 bg-red-500/10 text-red-400",
};

function isSettled(status: string) {
  return status === "completed" || status === "approved";
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const [balance, setBalance] = useState(0);
  const [allDeposits, setAllDeposits] = useState<Deposit[]>([]);
  const [transactions, setTransactions] = useState<UserTransaction[]>([]);
  const [selectedTx, setSelectedTx] = useState<UserTransaction | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (opts?: { soft?: boolean }) => {
    if (!user) return;
    const soft = opts?.soft === true;
    if (soft) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const [balRes, allDepRes, txList] = await withValidSession(() =>
        Promise.all([
          supabase.from("balances").select("amount").eq("user_id", user.id).single(),
          supabase.from("deposits").select("*").eq("user_id", user.id).order("created_at", { ascending: true }),
          fetchUserTransactions(user.id),
        ])
      );

      if (balRes.error && balRes.error.code !== "PGRST116") {
        setError(formatAuthError(balRes.error, t("auth.sessionExpired")));
      } else if (allDepRes.error) {
        setError(formatAuthError(allDepRes.error, t("dashboard.loadError")));
      }

      setBalance(Number(balRes.data?.amount ?? 0));
      setAllDeposits(allDepRes.data ?? []);
      setTransactions(txList);
    } catch (err) {
      setError(formatAuthError(err, t("dashboard.loadError")));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, t]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!user) return;
    const onVisible = () => {
      if (document.visibilityState === "visible") void load({ soft: true });
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [user, load]);

  const totalDeposits = useMemo(
    () => allDeposits.filter((d) => isSettled(d.status)).reduce((s, d) => s + Number(d.amount), 0),
    [allDeposits]
  );

  const activeTrades = transactions.filter(
    (tx) => tx.kind === "trade" && (tx.status === "pending" || tx.status === "approved")
  ).length;

  const recentTransactions = transactions.slice(0, OVERVIEW_TRANSACTION_LIMIT);

  /** Honest sparkline: reconstruct from settled cash events, end at live balance. */
  const chartData = useMemo(() => {
    const events = [
      ...allDeposits
        .filter((d) => isSettled(d.status))
        .map((d) => ({ at: d.created_at, delta: Number(d.amount) })),
      ...transactions
        .filter((tx) => tx.kind === "withdrawal" && isSettled(String(tx.status)))
        .map((tx) => ({ at: tx.created_at, delta: -Number(tx.amount) })),
    ].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

    const recent = events.slice(-14);
    if (recent.length === 0) {
      const b = Math.max(balance, 0);
      return [{ v: b }, { v: b }, { v: b }];
    }

    const net = recent.reduce((s, e) => s + e.delta, 0);
    let running = Math.max(0, balance - net);
    const points = recent.map((e) => {
      running = Math.max(0, running + e.delta);
      return { v: Math.round(running * 100) / 100 };
    });
    points[points.length - 1] = { v: Math.round(balance * 100) / 100 };
    return points;
  }, [allDeposits, transactions, balance]);

  const kycStatus = profile?.kyc_status ?? "none";
  const kycKey = KYC_LABELS[kycStatus] ?? "dashboard.kycNone";

  const stats = [
    { labelKey: "dashboard.totalDeposits", value: formatCurrency(totalDeposits), icon: ArrowDownToLine, hint: t("dashboard.settledDeposits") },
    { labelKey: "dashboard.activeTrades", value: activeTrades.toString(), icon: TrendingUp, hint: t("dashboard.openPositions") },
    { labelKey: "dashboard.accountStatus", value: t(kycKey), icon: ShieldCheck, hint: t("dashboard.verificationStatus") },
  ] as const;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t("dashboard.clientPortal")}
        title={t("dashboard.welcomeBack", { name: profile?.full_name || t("common.investor") })}
        subtitle={t("dashboard.portfolioOverview")}
        actions={
          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            <Button variant="outline" size="sm" asChild className="flex-1 sm:flex-none">
              <Link to="/dashboard/deposits">
                <ArrowDownToLine className="h-3.5 w-3.5" />
                {t("dashboard.deposits")}
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="flex-1 sm:flex-none">
              <Link to="/dashboard/withdrawals">
                <ArrowUpFromLine className="h-3.5 w-3.5" />
                {t("dashboard.withdrawals")}
              </Link>
            </Button>
            <Button size="sm" asChild className="w-full sm:w-auto">
              <Link to="/dashboard/trading-room">
                <CandlestickChart className="h-3.5 w-3.5" />
                {t("dashboard.tradingRoom")}
              </Link>
            </Button>
          </div>
        }
      />

      {error && (
        <div className="flex flex-col gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-red-400">{error}</p>
          <Button size="sm" variant="outline" disabled={refreshing} onClick={() => { void load({ soft: true }); }}>
            {t("errors.tryAgain")}
          </Button>
        </div>
      )}

      <div className="dashboard-hero overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald/10 via-transparent to-gold/5" />
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-emerald/10 blur-3xl" />
        <div className="relative grid gap-6 p-5 sm:p-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-stretch lg:p-7">
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
              <Wallet className="h-3.5 w-3.5 text-emerald" aria-hidden="true" />
              {t("dashboard.portfolioBalance")}
            </div>
            {loading ? (
              <div className="mt-3 h-12 w-48 animate-pulse rounded-xl bg-secondary/60" />
            ) : (
              <p className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl md:text-5xl">
                {formatCurrency(balance)}
              </p>
            )}
            <div
              className={cn(
                "mt-4 inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
                KYC_STYLES[kycStatus] ?? KYC_STYLES.none
              )}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              {t(kycKey)}
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button size="sm" className="rounded-full" asChild>
                <Link to="/dashboard/ai-trading">
                  <Bot className="h-3.5 w-3.5" />
                  {t("dashboard.aiTrading")}
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="rounded-full" asChild>
                <Link to="/dashboard/deposits">
                  <ArrowDownToLine className="h-3.5 w-3.5" />
                  {t("dashboard.fundAccount")}
                </Link>
              </Button>
            </div>
          </div>
          <div className="relative h-40 text-emerald sm:h-44 lg:h-auto lg:min-h-[180px]">
            <div className="absolute inset-0 rounded-2xl border border-border/60 bg-background/30 backdrop-blur-sm" />
            <div className="relative h-full px-2 pt-4">
              {loading ? (
                <div className="h-full animate-pulse rounded-xl bg-secondary/40" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="portfolioChart" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="currentColor" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="v"
                      stroke="currentColor"
                      strokeWidth={2.25}
                      fill="url(#portfolioChart)"
                      isAnimationActive
                      animationDuration={700}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>

      <StaggerContainer className="grid gap-3 sm:grid-cols-3">
        {stats.map((s) => (
          <StaggerItem key={s.labelKey}>
            <div className="dashboard-stat group">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{t(s.labelKey)}</p>
                  {loading ? (
                    <div className="mt-3 h-7 w-24 animate-pulse rounded-md bg-secondary/60" />
                  ) : (
                    <p className="mt-2 truncate font-display text-xl font-semibold text-foreground">{s.value}</p>
                  )}
                  <p className="mt-1 text-xs text-muted">{s.hint}</p>
                </div>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-secondary/50 text-emerald transition-colors group-hover:border-emerald/30 group-hover:bg-emerald/10">
                  <s.icon className="h-4 w-4" aria-hidden="true" />
                </div>
              </div>
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>

      <RecentTransactionsCard
        items={loading ? [] : recentTransactions}
        total={transactions.length}
        limit={OVERVIEW_TRANSACTION_LIMIT}
        onItemClick={setSelectedTx}
        selectedId={selectedTx?.id}
      />

      <TransactionReceiptPanel transaction={selectedTx} onClose={() => setSelectedTx(null)} />
    </div>
  );
}
