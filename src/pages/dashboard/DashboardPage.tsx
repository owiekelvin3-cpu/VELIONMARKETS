import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { StaggerContainer, StaggerItem } from "@/components/motion/Motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { formatAuthError, withValidSession } from "@/lib/auth-session";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import {
  ArrowDownToLine, ArrowUpFromLine, TrendingUp, Wallet,
  ShieldCheck, Bot,
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
  }, [user]);

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

  const quickActions = [
    { href: "/dashboard/ai-trading", labelKey: "dashboard.aiTrading", icon: Bot },
    { href: "/dashboard/trading-room", labelKey: "dashboard.tradingRoom", icon: TrendingUp },
    { href: "/dashboard/deposits", labelKey: "dashboard.deposits", icon: ArrowDownToLine },
    { href: "/dashboard/withdrawals", labelKey: "dashboard.withdrawals", icon: ArrowUpFromLine },
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted">{t("dashboard.welcomeBack", { name: profile?.full_name || t("common.investor") })}</p>
        <h1 className="mt-1 font-display text-2xl font-bold text-foreground md:text-3xl">{t("dashboard.portfolioOverview")}</h1>
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-2 text-sm text-red-400">{error}</p>
      )}

      <div className="overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-secondary to-transparent">
        <div className="grid gap-6 p-6 lg:grid-cols-2 lg:p-8">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted">
              <Wallet className="h-4 w-4 text-emerald" aria-hidden="true" />
              {t("dashboard.portfolioBalance")}
            </div>
            <p className="mt-2 font-display text-4xl font-bold tracking-tight text-gradient-emerald md:text-5xl">
              {formatCurrency(balance)}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {quickActions.map((action) => (
                <Button key={action.href} variant="outline" size="sm" asChild className="border-border bg-secondary/60">
                  <Link to={action.href}>
                    <action.icon className="mr-2 h-4 w-4" />
                    {t(action.labelKey)}
                  </Link>
                </Button>
              ))}
            </div>
          </div>
          <div className="h-40 lg:h-auto lg:min-h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="portfolioChart" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke="#10b981" strokeWidth={2} fill="url(#portfolioChart)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <StaggerContainer className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <StaggerItem key={s.labelKey}>
            <div className="rounded-xl border border-border bg-secondary/50 p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted">{t(s.labelKey)}</p>
                <s.icon className="h-4 w-4 text-emerald/70" aria-hidden="true" />
              </div>
              <p className="mt-2 font-display text-2xl font-bold text-foreground">{s.value}</p>
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
