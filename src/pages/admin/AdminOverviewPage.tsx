import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Users, FileCheck, ArrowDownToLine, ArrowUpFromLine, TrendingUp,
  RefreshCw, Bell,
} from "@/lib/icons";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { useAdminStats } from "@/hooks/useAdminStats";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { FadeIn } from "@/components/motion/Motion";
import { useAuth } from "@/hooks/useAuth";

const QUICK_LINKS = [
  { href: "/dashboard/admin/kyc", labelKey: "admin.kycReview", icon: FileCheck, stat: "pendingKyc" as const },
  { href: "/dashboard/admin/deposits", labelKey: "admin.deposits", icon: ArrowDownToLine, stat: "pendingDeposits" as const },
  { href: "/dashboard/admin/withdrawals", labelKey: "admin.withdrawals", icon: ArrowUpFromLine, stat: "pendingWithdrawals" as const },
  { href: "/dashboard/admin/users", labelKey: "admin.users", icon: Users, stat: "totalUsers" as const },
] as const;

export default function AdminOverviewPage() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { stats, loading, refresh } = useAdminStats();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t("admin.overviewTitle")}
        subtitle={t("admin.overviewSubtitle", { name: profile?.full_name || profile?.email || "Admin" })}
        action={
          <Button variant="outline" size="sm" onClick={refresh} className="border-border">
            <RefreshCw className={cnIcon(loading)} />
            {t("admin.refresh")}
          </Button>
        }
      />

      <FadeIn className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label={t("admin.totalUsers")} value={stats.totalUsers} icon={Users} loading={loading} />
        <AdminStatCard label={t("admin.pendingDeposits")} value={stats.pendingDeposits} icon={ArrowDownToLine} accent="blue" loading={loading} />
        <AdminStatCard label={t("admin.pendingWithdrawals")} value={stats.pendingWithdrawals} icon={ArrowUpFromLine} accent="gold" loading={loading} />
        <AdminStatCard label={t("admin.pendingKyc")} value={stats.pendingKyc} icon={FileCheck} accent="red" loading={loading} />
      </FadeIn>

      <FadeIn className="grid gap-4 lg:grid-cols-2">
        <AdminStatCard
          label={t("admin.totalDepositsVolume")}
          value={formatCurrency(stats.totalDeposits)}
          icon={ArrowDownToLine}
          accent="emerald"
          loading={loading}
        />
        <AdminStatCard
          label={t("admin.totalWithdrawalsVolume")}
          value={formatCurrency(stats.totalWithdrawals)}
          icon={ArrowUpFromLine}
          accent="blue"
          loading={loading}
        />
      </FadeIn>

      <FadeIn>
        <AdminPanel title={t("admin.quickActions")} description={t("admin.quickActionsDesc")}>
          <div className="grid gap-3 sm:grid-cols-2">
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="flex items-center gap-4 rounded-xl border border-border bg-secondary/50 p-4 transition-colors hover:border-emerald/25 hover:bg-secondary/70"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald/10 text-emerald">
                  <link.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">{t(link.labelKey)}</p>
                  <p className="text-xs text-muted">
                    {loading ? "—" : stats[link.stat]} {t("admin.itemsPending")}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </AdminPanel>
      </FadeIn>

      <FadeIn>
        <AdminPanel title={t("admin.systemStatus")} description={t("admin.systemStatusDesc")}>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald" />
              <span className="text-muted">{t("admin.statusTrading")}</span>
              <span className="font-medium text-emerald">{t("admin.statusOnline")}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald" />
              <span className="text-muted">{t("admin.statusDeposits")}</span>
              <span className="font-medium text-foreground">{stats.pendingDeposits} {t("admin.pending")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted" />
              <span className="text-muted">{t("admin.activeTrades")}</span>
              <span className="font-medium text-foreground">{stats.activeTrades}</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted" />
              <Link to="/dashboard/admin/trades" className="text-emerald hover:underline">{t("admin.manageTrades")}</Link>
            </div>
          </div>
        </AdminPanel>
      </FadeIn>
    </div>
  );
}

function cnIcon(loading: boolean) {
  return `mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`;
}
