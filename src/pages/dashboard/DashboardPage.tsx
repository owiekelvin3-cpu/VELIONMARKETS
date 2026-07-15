import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { formatAuthError, withValidSession } from "@/lib/auth-session";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";
import { isKycApproved } from "@/lib/kyc";
import {
  ArrowDownToLine, ArrowUpFromLine, TrendingUp, ShieldCheck, Bot, CandlestickChart,
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

function isSettled(status: string) {
  return status === "completed" || status === "approved";
}

function formatBalanceParts(amount: number) {
  const formatted = formatCurrency(amount);
  const match = formatted.match(/^([^0-9.-]*)([0-9,]+)([.][0-9]+)?(.*)$/);
  if (!match) return { prefix: "", whole: formatted, decimals: "", suffix: "" };
  return { prefix: match[1], whole: match[2], decimals: match[3] ?? "", suffix: match[4] };
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

  const totalWithdrawals = useMemo(
    () =>
      transactions
        .filter((tx) => tx.kind === "withdrawal" && isSettled(String(tx.status)))
        .reduce((s, tx) => s + Number(tx.amount), 0),
    [transactions]
  );

  const activeTrades = transactions.filter(
    (tx) => tx.kind === "trade" && (tx.status === "pending" || tx.status === "approved")
  ).length;

  const recentTransactions = transactions.slice(0, OVERVIEW_TRANSACTION_LIMIT);

  const activityKinds = useMemo(() => {
    const seen = new Set<string>();
    const icons: { key: string; Icon: typeof ArrowDownToLine; className: string }[] = [];
    for (const tx of recentTransactions) {
      if (seen.has(tx.kind)) continue;
      seen.add(tx.kind);
      if (tx.kind === "deposit") icons.push({ key: "deposit", Icon: ArrowDownToLine, className: "bg-emerald/20 text-emerald" });
      if (tx.kind === "withdrawal") icons.push({ key: "withdrawal", Icon: ArrowUpFromLine, className: "bg-amber-500/20 text-amber-400" });
      if (tx.kind === "trade") icons.push({ key: "trade", Icon: TrendingUp, className: "bg-sky-500/20 text-sky-400" });
      if (icons.length >= 3) break;
    }
    return icons;
  }, [recentTransactions]);

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
  const balanceParts = formatBalanceParts(balance);
  const cashHref = isKycApproved(profile) ? "/dashboard/deposits" : "/dashboard/kyc";
  const withdrawHref = isKycApproved(profile) ? "/dashboard/withdrawals" : "/dashboard/kyc";
  const tradeHref = isKycApproved(profile) ? "/dashboard/trading-room" : "/dashboard/kyc";

  return (
    <div className="space-y-0 lg:space-y-6">
      {error && (
        <div className="mb-4 flex flex-col gap-2 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-red-400">{error}</p>
          <Button size="sm" variant="outline" disabled={refreshing} onClick={() => { void load({ soft: true }); }}>
            {t("errors.tryAgain")}
          </Button>
        </div>
      )}

      {/* Mobile-first finance hero */}
      <div className="dashboard-hero -mx-3 rounded-none px-5 pb-8 pt-2 sm:-mx-0 sm:rounded-[1.75rem] sm:px-7 sm:pb-8 sm:pt-6 lg:px-8">
        <div className="pointer-events-none absolute -right-6 top-8 flex h-40 w-10 flex-col gap-1.5 opacity-80 sm:right-8 sm:top-10 sm:h-48">
          <div className="flex-1 rounded-full bg-gold/90" />
          <div className="flex-[1.2] rounded-full bg-emerald" />
          <div className="flex-[0.8] rounded-full bg-sky-400" />
        </div>

        <p className="dashboard-hero-muted text-sm font-medium">
          {t("dashboard.welcomeBack", { name: profile?.full_name?.split(" ")[0] || t("common.investor") })}
        </p>
        <p className="mt-6 text-xs font-medium uppercase tracking-[0.14em] text-white/45">
          {t("dashboard.totalBalance")}
        </p>

        {loading ? (
          <div className="mt-3 h-14 w-56 animate-pulse rounded-2xl bg-white/10" />
        ) : (
          <p className="mt-2 font-display text-[2.75rem] font-semibold leading-none tracking-tight text-white sm:text-5xl">
            <span className="mr-1 text-2xl font-medium text-white/70 sm:text-3xl">{balanceParts.prefix || "$"}</span>
            {balanceParts.whole}
            {balanceParts.decimals ? (
              <span className="text-2xl font-medium text-white/55 sm:text-3xl">{balanceParts.decimals}</span>
            ) : null}
          </p>
        )}

        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/75">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-soft" />
          {t(kycKey)}
        </div>

        <div className="relative mt-7 flex flex-wrap gap-3">
          <Link to={cashHref} className="dashboard-pill-primary">
            <ArrowDownToLine className="h-4 w-4" />
            {t("dashboard.deposits")}
          </Link>
          <Link to={withdrawHref} className="dashboard-pill-secondary">
            <ArrowUpFromLine className="h-4 w-4" />
            {t("dashboard.withdrawals")}
          </Link>
          <Link to={tradeHref} className="dashboard-pill-secondary hidden sm:inline-flex">
            <CandlestickChart className="h-4 w-4" />
            {t("dashboard.tradingRoom")}
          </Link>
        </div>

        <div className="relative mt-6 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-md">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-white/50">{t("dashboard.activityStrip")}</p>
            <p className="mt-0.5 font-display text-lg font-semibold text-white">
              {loading ? "—" : formatCurrency(totalWithdrawals + Math.max(0, totalDeposits - balance))}
            </p>
            <p className="text-[11px] text-white/40">
              {t("dashboard.settledDeposits")} · {loading ? "—" : formatCurrency(totalDeposits)}
            </p>
          </div>
          <div className="flex -space-x-2">
            {(activityKinds.length > 0 ? activityKinds : [
              { key: "d", Icon: ArrowDownToLine, className: "bg-emerald/20 text-emerald" },
              { key: "t", Icon: TrendingUp, className: "bg-sky-500/20 text-sky-400" },
              { key: "a", Icon: Bot, className: "bg-gold/20 text-gold" },
            ]).map(({ key, Icon, className }) => (
              <div
                key={key}
                className={cn("flex h-9 w-9 items-center justify-center rounded-full ring-2 ring-[#0c0c0e]", className)}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>
            ))}
          </div>
        </div>

        {/* Desktop sparkline inside hero */}
        <div className="relative mt-6 hidden h-28 text-emerald-soft lg:block">
          {loading ? (
            <div className="h-full animate-pulse rounded-2xl bg-white/5" />
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

      {/* Quick stats — desktop / tablet */}
      <div className="mt-4 hidden gap-3 sm:grid sm:grid-cols-3 lg:mt-0">
        {[
          { label: t("dashboard.totalDeposits"), value: formatCurrency(totalDeposits), icon: ArrowDownToLine },
          { label: t("dashboard.activeTrades"), value: String(activeTrades), icon: TrendingUp },
          { label: t("dashboard.accountStatus"), value: t(kycKey), icon: ShieldCheck },
        ].map((s) => (
          <div key={s.label} className="dashboard-stat">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{s.label}</p>
                {loading ? (
                  <div className="mt-3 h-7 w-24 animate-pulse rounded-md bg-secondary/60" />
                ) : (
                  <p className="mt-2 truncate font-display text-xl font-semibold text-foreground">{s.value}</p>
                )}
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald/10 text-emerald">
                <s.icon className="h-4 w-4" aria-hidden="true" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="relative z-[1] -mt-4 sm:mt-2 lg:mt-0">
        <RecentTransactionsCard
          items={loading ? [] : recentTransactions}
          total={transactions.length}
          limit={OVERVIEW_TRANSACTION_LIMIT}
          onItemClick={setSelectedTx}
          selectedId={selectedTx?.id}
        />
      </div>

      <TransactionReceiptPanel transaction={selectedTx} onClose={() => setSelectedTx(null)} />
    </div>
  );
}
