import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { StaggerContainer, StaggerItem } from "@/components/motion/Motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { ensureValidSession } from "@/lib/auth-session";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import {
  ArrowDownToLine, ArrowUpFromLine, TrendingUp, Wallet,
  ArrowRight, ShieldCheck, Bot,
} from "@/lib/icons";
import type { Deposit, Trade } from "@/types/database";

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
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [allDeposits, setAllDeposits] = useState<Deposit[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setError("");
      await ensureValidSession();
      const [balRes, depRes, allDepRes, tradeRes] = await Promise.all([
        supabase.from("balances").select("amount").eq("user_id", user.id).single(),
        supabase.from("deposits").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
        supabase.from("deposits").select("*").eq("user_id", user.id).order("created_at", { ascending: true }),
        supabase.from("trades").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
      ]);
      if (balRes.error && balRes.error.code !== "PGRST116") setError(balRes.error.message);
      setBalance(balRes.data?.amount ?? 0);
      setDeposits(depRes.data ?? []);
      setAllDeposits(allDepRes.data ?? []);
      setTrades(tradeRes.data ?? []);
    };
    load();
  }, [user]);

  const totalDeposits = useMemo(
    () => allDeposits.filter((d) => d.status === "completed" || d.status === "approved").reduce((s, d) => s + Number(d.amount), 0),
    [allDeposits]
  );

  const activeTrades = trades.filter((tr) => tr.status === "pending" || tr.status === "approved").length;

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

      <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.04] to-transparent">
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
                <Button key={action.href} variant="outline" size="sm" asChild className="border-white/10 bg-white/[0.03]">
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
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted">{t(s.labelKey)}</p>
                <s.icon className="h-4 w-4 text-emerald/70" aria-hidden="true" />
              </div>
              <p className="mt-2 font-display text-2xl font-bold text-foreground">{s.value}</p>
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
            <h2 className="font-display font-semibold text-foreground">{t("dashboard.recentDeposits")}</h2>
            <Link to="/dashboard/deposits" className="flex items-center text-xs text-emerald hover:underline">
              {t("dashboard.viewAll")} <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </div>
          <div className="p-5">
            {deposits.length === 0 ? (
              <p className="text-sm text-muted">{t("dashboard.noDeposits")}</p>
            ) : (
              <div className="space-y-3">
                {deposits.map((d) => (
                  <div key={d.id} className="flex items-center justify-between rounded-lg bg-white/[0.02] px-3 py-2.5 text-sm">
                    <span className="font-medium">{formatCurrency(d.amount)}</span>
                    <Badge variant={d.status === "completed" ? "success" : "warning"}>{d.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
            <h2 className="font-display font-semibold text-foreground">{t("dashboard.recentTrades")}</h2>
            <Link to="/dashboard/trades" className="flex items-center text-xs text-emerald hover:underline">
              {t("dashboard.viewAll")} <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </div>
          <div className="p-5">
            {trades.length === 0 ? (
              <p className="text-sm text-muted">{t("dashboard.noTrades")}</p>
            ) : (
              <div className="space-y-3">
                {trades.map((tr) => (
                  <div key={tr.id} className="flex items-center justify-between rounded-lg bg-white/[0.02] px-3 py-2.5 text-sm">
                    <span className="font-medium">{tr.type.toUpperCase()} {tr.asset}</span>
                    <Badge variant={tr.status === "completed" ? "success" : "warning"}>{tr.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
