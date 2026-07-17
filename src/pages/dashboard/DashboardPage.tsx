import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { formatAuthError, withValidSession } from "@/lib/auth-session";
import { Button } from "@/components/ui/button";
import { CurrencySelector } from "@/components/settings/CurrencySelector";
import { cn, formatCurrency } from "@/lib/utils";
import { isKycApproved } from "@/lib/kyc";
import { updateUserCurrency } from "@/lib/profile-settings";
import {
  formatMoney,
  parseCurrencyConversionResult,
  setActiveCurrency,
} from "@/lib/currency";
import { DEFAULT_CURRENCY } from "@/constants/currencies";
import {
  ArrowDownToLine, ArrowUpFromLine, TrendingUp, ShieldCheck, CandlestickChart, ChevronRight,
} from "@/lib/icons";
import { RecentTransactionsCard } from "@/components/dashboard/TransactionList";
import { TransactionReceiptPanel } from "@/components/dashboard/TransactionReceiptPanel";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/motion/Motion";
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

function formatBalanceParts(amount: number, currency: string) {
  const formatted = formatCurrency(amount, currency);
  const match = formatted.match(/^([^0-9.-]*)([0-9,]+)([.][0-9]+)?(.*)$/);
  if (!match) {
    const symbol = formatMoney(0, currency).replace(/[\d.,\s\u00a0-]/g, "").trim();
    return { prefix: symbol, whole: formatted, decimals: "", suffix: "" };
  }
  return { prefix: match[1], whole: match[2], decimals: match[3] ?? "", suffix: match[4] };
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user, profile, refreshProfile } = useAuth();
  const [balance, setBalance] = useState(0);
  const [allDeposits, setAllDeposits] = useState<Deposit[]>([]);
  const [transactions, setTransactions] = useState<UserTransaction[]>([]);
  const [selectedTx, setSelectedTx] = useState<UserTransaction | null>(null);
  const [error, setError] = useState("");
  const [currencyMessage, setCurrencyMessage] = useState("");
  const [currencyBusy, setCurrencyBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const accountCurrency = profile?.preferred_currency ?? DEFAULT_CURRENCY;

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

  const handleCurrencyChange = async (code: string) => {
    if (!user) return;
    if (code === accountCurrency) return;
    setCurrencyBusy(true);
    setCurrencyMessage("");
    try {
      const data = await updateUserCurrency(user.id, code);
      const result = parseCurrencyConversionResult(data);
      setActiveCurrency(code);
      await refreshProfile(user.id);
      if (result?.converted) {
        setCurrencyMessage(
          t("settingsPage.currencyConverted", {
            currency: result.toCurrency,
            balance: formatMoney(result.balance, result.toCurrency),
          })
        );
        window.setTimeout(() => window.location.reload(), 1200);
      } else {
        setCurrencyMessage(t("settingsPage.currencyUpdated"));
        void load({ soft: true });
      }
    } catch {
      setError(t("settingsPage.saveFailed"));
    } finally {
      setCurrencyBusy(false);
    }
  };

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

  const activeTrades = useMemo(
    () =>
      transactions.filter(
        (tx) => tx.kind === "trade" && (tx.status === "pending" || tx.status === "approved")
      ).length,
    [transactions]
  );

  const recentTransactions = transactions.slice(0, OVERVIEW_TRANSACTION_LIMIT);

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
  const kycApproved = isKycApproved(profile);
  const kycKey = KYC_LABELS[kycStatus] ?? "dashboard.kycNone";
  const balanceParts = formatBalanceParts(balance, accountCurrency);
  const cashHref = kycApproved ? "/dashboard/deposits" : "/dashboard/kyc";
  const withdrawHref = kycApproved ? "/dashboard/withdrawals" : "/dashboard/kyc";
  const tradeHref = kycApproved ? "/dashboard/trading-room" : "/dashboard/kyc";
  const firstName = profile?.full_name?.split(" ")[0] || t("common.investor");

  const metrics = [
    {
      label: t("dashboard.totalDeposits"),
      value: formatCurrency(totalDeposits, accountCurrency),
      icon: ArrowDownToLine,
      href: cashHref,
    },
    {
      label: t("dashboard.totalWithdrawals"),
      value: formatCurrency(totalWithdrawals, accountCurrency),
      icon: ArrowUpFromLine,
      href: withdrawHref,
    },
    {
      label: t("dashboard.activeTrades"),
      value: String(activeTrades),
      icon: TrendingUp,
      href: tradeHref,
    },
  ];

  return (
    <div className="space-y-5 sm:space-y-6">
      {error && (
        <div className="flex flex-col gap-2 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-red-400">{error}</p>
          <Button size="sm" variant="outline" disabled={refreshing} onClick={() => { void load({ soft: true }); }}>
            {t("errors.tryAgain")}
          </Button>
        </div>
      )}

      {currencyMessage && (
        <div className="rounded-2xl border border-emerald/25 bg-emerald/10 px-4 py-3">
          <p className="text-sm text-emerald">{currencyMessage}</p>
        </div>
      )}

      <FadeIn>
        <section className="dashboard-hero -mx-3 rounded-none px-5 pb-7 pt-3 sm:mx-0 sm:rounded-[1.75rem] sm:px-8 sm:pb-8 sm:pt-7">
          <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(12rem,18rem)] lg:items-end lg:gap-10">
            <div className="min-w-0">
              <p className="dashboard-hero-muted text-sm">
                {t("dashboard.welcomeBack", { name: firstName })}
              </p>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">
                  {t("dashboard.totalBalance")}
                </p>
                <CurrencySelector
                  value={accountCurrency}
                  onChange={handleCurrencyChange}
                  busy={currencyBusy}
                  className="h-8 min-w-[5.5rem] border-white/20 bg-white/10 px-2.5 text-xs text-white hover:bg-white/15 [&_svg]:text-white/60"
                />
              </div>

              {loading ? (
                <div className="mt-3 h-14 w-52 animate-pulse rounded-2xl bg-white/10" />
              ) : (
                <p className="mt-2 font-display text-[2.85rem] font-semibold leading-none tracking-tight text-white sm:text-[3.25rem]">
                  {balanceParts.prefix ? (
                    <span className="mr-1 text-[1.65rem] font-medium text-white/65 sm:text-3xl">
                      {balanceParts.prefix}
                    </span>
                  ) : null}
                  {balanceParts.whole}
                  {balanceParts.decimals ? (
                    <span className="text-[1.65rem] font-medium text-white/45 sm:text-3xl">
                      {balanceParts.decimals}
                    </span>
                  ) : null}
                  {balanceParts.suffix ? (
                    <span className="ml-1 text-[1.65rem] font-medium text-white/65 sm:text-3xl">
                      {balanceParts.suffix}
                    </span>
                  ) : null}
                </p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-2.5">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                    kycApproved
                      ? "bg-emerald/15 text-emerald-soft"
                      : "bg-white/8 text-white/70"
                  )}
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {t(kycKey)}
                </span>
              </div>

              <div className="mt-7 flex flex-wrap gap-2.5">
                <Link to={cashHref} className="dashboard-pill-primary">
                  <ArrowDownToLine className="h-4 w-4" />
                  {t("dashboard.deposits")}
                </Link>
                <Link to={withdrawHref} className="dashboard-pill-secondary">
                  <ArrowUpFromLine className="h-4 w-4" />
                  {t("dashboard.withdrawals")}
                </Link>
                <Link to={tradeHref} className="dashboard-pill-secondary">
                  <CandlestickChart className="h-4 w-4" />
                  {t("dashboard.tradingRoom")}
                </Link>
              </div>
            </div>

            <div className="relative hidden h-36 text-emerald-soft lg:block">
              {loading ? (
                <div className="h-full animate-pulse rounded-2xl bg-white/5" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="portfolioChart" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="currentColor" stopOpacity={0.28} />
                        <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="v"
                      stroke="currentColor"
                      strokeWidth={2}
                      fill="url(#portfolioChart)"
                      isAnimationActive
                      animationDuration={700}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {!kycApproved && (
            <Link
              to="/dashboard/kyc"
              className="mt-6 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 transition-colors hover:bg-white/[0.07]"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1 text-left">
                <span className="block text-sm font-medium text-white">
                  {t("dashboard.completeVerification")}
                </span>
                <span className="mt-0.5 block text-xs text-white/50">
                  {t("dashboard.completeVerificationDesc")}
                </span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-white/40" />
            </Link>
          )}
        </section>
      </FadeIn>

      <StaggerContainer className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border/70 bg-border/60 sm:grid-cols-3">
        {metrics.map((metric) => (
          <StaggerItem key={metric.label}>
            <Link
              to={metric.href}
              className="dashboard-metric group flex h-full items-start justify-between gap-3 bg-card px-4 py-4 transition-colors hover:bg-secondary/40 sm:px-5 sm:py-5"
            >
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                  {metric.label}
                </p>
                {loading ? (
                  <div className="mt-3 h-7 w-24 animate-pulse rounded-md bg-secondary/60" />
                ) : (
                  <p className="mt-2 truncate font-display text-xl font-semibold tracking-tight text-foreground">
                    {metric.value}
                  </p>
                )}
              </div>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald/10 text-emerald transition-transform group-hover:scale-105">
                <metric.icon className="h-4 w-4" aria-hidden="true" />
              </span>
            </Link>
          </StaggerItem>
        ))}
      </StaggerContainer>

      <FadeIn delay={0.08}>
        <RecentTransactionsCard
          items={loading ? [] : recentTransactions}
          total={transactions.length}
          limit={OVERVIEW_TRANSACTION_LIMIT}
          onItemClick={setSelectedTx}
          selectedId={selectedTx?.id}
        />
      </FadeIn>

      <TransactionReceiptPanel transaction={selectedTx} onClose={() => setSelectedTx(null)} />
    </div>
  );
}
