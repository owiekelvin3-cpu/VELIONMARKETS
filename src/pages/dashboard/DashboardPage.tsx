import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { StaggerContainer, StaggerItem } from "@/components/motion/Motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { formatAuthError, withValidSession } from "@/lib/auth-session";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { formatCurrency } from "@/lib/utils";
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

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const [balance, setBalance] = useState(0);
  const [allDeposits, setAllDeposits] = useState<Deposit[]>([]);
  const [transactions, setTransactions] = useState<UserTransaction[]>([]);
  const [selectedTx, setSelectedTx] = useState<UserTransaction | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    const load = async () => {
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
        }
        setBalance(balRes.data?.amount ?? 0);
        setAllDeposits(allDepRes.data ?? []);
        setTransactions(txList);
      } catch {
        setError(t("auth.sessionExpired"));
      }
    };
    load();
  }, [user, t]);

  const totalDeposits = useMemo(
    () => allDeposits.filter((d) => d.status === "completed" || d.status === "approved").reduce((s, d) => s + Number(d.amount), 0),
    [allDeposits]
  );

  const activeTrades = transactions.filter(
    (tx) => tx.kind === "trade" && (tx.status === "pending" || tx.status === "approved")
  ).length;

  const recentTransactions = transactions.slice(0, OVERVIEW_TRANSACTION_LIMIT);

  const chartData = useMemo(() => {
    let running = Math.max(balance * 0.7, 0);
    const points = allDeposits
      .filter((d) => d.status === "completed" || d.status === "approved")
      .slice(-12);
    if (points.length === 0) {
      return [{ v: balance }, { v: balance }];
    }
    return points.map((d) => {
      running += Number(d.amount);
      return { v: Math.round(running) };
    });
  }, [allDeposits, balance]);

  const kycKey = KYC_LABELS[profile?.kyc_status ?? "none"] ?? "dashboard.kycNone";

  const stats = [
    { labelKey: "dashboard.totalDeposits", value: formatCurrency(totalDeposits), icon: ArrowDownToLine },
    { labelKey: "dashboard.activeTrades", value: activeTrades.toString(), icon: TrendingUp },
    { labelKey: "dashboard.accountStatus", value: t(kycKey), icon: ShieldCheck },
  ] as const;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t("dashboard.title")}
        title={t("dashboard.welcomeBack", { name: profile?.full_name || t("common.investor") })}
        subtitle={t("dashboard.portfolioOverview")}
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link to="/dashboard/deposits">
                <ArrowDownToLine className="h-3.5 w-3.5" />
                {t("dashboard.deposits")}
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/dashboard/withdrawals">
                <ArrowUpFromLine className="h-3.5 w-3.5" />
                {t("dashboard.withdrawals")}
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/dashboard/trading-room">
                <CandlestickChart className="h-3.5 w-3.5" />
                {t("dashboard.tradingRoom")}
              </Link>
            </Button>
          </>
        }
      />

      {error && (
        <p className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-2 text-sm text-red-400">{error}</p>
      )}

      <div className="surface-panel overflow-hidden">
        <div className="grid gap-6 p-5 md:p-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-stretch">
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted">
              <Wallet className="h-3.5 w-3.5 text-emerald" aria-hidden="true" />
              {t("dashboard.portfolioBalance")}
            </div>
            <p className="mt-2 font-display text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
              {formatCurrency(balance)}
            </p>
            <div className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-md border border-border bg-secondary/40 px-2.5 py-1 text-xs text-muted">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald" />
              {t(kycKey)}
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button size="sm" asChild>
                <Link to="/dashboard/ai-trading">
                  <Bot className="h-3.5 w-3.5" />
                  {t("dashboard.aiTrading")}
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/dashboard/trading-room">
                  <TrendingUp className="h-3.5 w-3.5" />
                  {t("dashboard.tradingRoom")}
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/dashboard/deposits">
                  <ArrowDownToLine className="h-3.5 w-3.5" />
                  {t("dashboard.deposits")}
                </Link>
              </Button>
            </div>
          </div>
          <div className="h-36 text-emerald lg:h-auto lg:min-h-[168px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="portfolioChart" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="currentColor" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke="currentColor" strokeWidth={2} fill="url(#portfolioChart)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <StaggerContainer className="grid gap-3 sm:grid-cols-3">
        {stats.map((s) => (
          <StaggerItem key={s.labelKey}>
            <div className="surface-muted p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-muted">{t(s.labelKey)}</p>
                <s.icon className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
              </div>
              <p className="mt-2 font-display text-xl font-semibold text-foreground">{s.value}</p>
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>

      <RecentTransactionsCard
        items={recentTransactions}
        total={transactions.length}
        limit={OVERVIEW_TRANSACTION_LIMIT}
        onItemClick={setSelectedTx}
        selectedId={selectedTx?.id}
      />

      <TransactionReceiptPanel transaction={selectedTx} onClose={() => setSelectedTx(null)} />
    </div>
  );
}
