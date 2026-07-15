import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Users, FileCheck, ArrowDownToLine, ArrowUpFromLine, TrendingUp,
  RefreshCw, Bell, MessageCircle, ChevronRight,
} from "@/lib/icons";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { useAdminStats } from "@/hooks/useAdminStats";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/motion/Motion";
import { useAuth } from "@/hooks/useAuth";

const QUICK_LINKS = [
  { href: "/dashboard/admin/kyc", labelKey: "admin.kycReview", icon: FileCheck, stat: "pendingKyc" as const, accent: "red" as const },
  { href: "/dashboard/admin/deposits", labelKey: "admin.deposits", icon: ArrowDownToLine, stat: "pendingDeposits" as const, accent: "blue" as const },
  { href: "/dashboard/admin/withdrawals", labelKey: "admin.withdrawals", icon: ArrowUpFromLine, stat: "pendingWithdrawals" as const, accent: "gold" as const },
  { href: "/dashboard/admin/users", labelKey: "admin.users", icon: Users, stat: "totalUsers" as const, accent: "emerald" as const },
  { href: "/dashboard/admin/support", labelKey: "admin.support", icon: MessageCircle, stat: null, accent: "emerald" as const },
  { href: "/dashboard/admin/trades", labelKey: "admin.trades", icon: TrendingUp, stat: "activeTrades" as const, accent: "blue" as const },
] as const;

const ACCENT_ICON = {
  emerald: "bg-emerald/12 text-emerald",
  gold: "bg-gold/12 text-gold",
  blue: "bg-sky-500/12 text-sky-400",
  red: "bg-red-500/12 text-red-400",
} as const;

export default function AdminOverviewPage() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { stats, loading, refresh } = useAdminStats();

  const attention =
    stats.pendingKyc + stats.pendingDeposits + stats.pendingWithdrawals;

  return (
    <div className="space-y-5 sm:space-y-6">
      <AdminPageHeader
        eyebrow={t("admin.portalLabel")}
        title={t("admin.overviewTitle")}
        subtitle={t("admin.overviewSubtitle", { name: profile?.full_name || profile?.email || t("admin.badge") })}
        action={
          <Button variant="outline" size="sm" onClick={refresh} className="w-full rounded-full border-border sm:w-auto">
            <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
            {t("admin.refresh")}
          </Button>
        }
      />

      {/* Attention hero */}
      <FadeIn>
        <div className="admin-hero overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-gold/15 via-transparent to-emerald/10" />
          <div className="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full bg-gold/15 blur-3xl" />
          <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold/90">
                {t("admin.attentionQueue")}
              </p>
              {loading ? (
                <div className="mt-3 h-10 w-28 animate-pulse rounded-xl bg-secondary/60" />
              ) : (
                <p className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  {attention}
                </p>
              )}
              <p className="mt-1.5 text-sm text-muted">{t("admin.attentionQueueDesc")}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" className="rounded-full" asChild>
                <Link to="/dashboard/admin/deposits">
                  <ArrowDownToLine className="h-3.5 w-3.5" />
                  {t("admin.deposits")}
                </Link>
              </Button>
              <Button size="sm" variant="outline" className="rounded-full" asChild>
                <Link to="/dashboard/admin/withdrawals">
                  <ArrowUpFromLine className="h-3.5 w-3.5" />
                  {t("admin.withdrawals")}
                </Link>
              </Button>
              <Button size="sm" variant="outline" className="rounded-full" asChild>
                <Link to="/dashboard/admin/kyc">
                  <FileCheck className="h-3.5 w-3.5" />
                  {t("admin.kycReview")}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </FadeIn>

      <StaggerContainer className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StaggerItem>
          <AdminStatCard label={t("admin.totalUsers")} value={stats.totalUsers} icon={Users} loading={loading} />
        </StaggerItem>
        <StaggerItem>
          <AdminStatCard label={t("admin.pendingDeposits")} value={stats.pendingDeposits} icon={ArrowDownToLine} accent="blue" loading={loading} />
        </StaggerItem>
        <StaggerItem>
          <AdminStatCard label={t("admin.pendingWithdrawals")} value={stats.pendingWithdrawals} icon={ArrowUpFromLine} accent="gold" loading={loading} />
        </StaggerItem>
        <StaggerItem>
          <AdminStatCard label={t("admin.pendingKyc")} value={stats.pendingKyc} icon={FileCheck} accent="red" loading={loading} />
        </StaggerItem>
      </StaggerContainer>

      <FadeIn className="grid gap-3 sm:grid-cols-2">
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
          <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 scrollbar-none sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="flex min-w-[15.5rem] items-center gap-3 rounded-2xl border border-border bg-background/40 p-4 transition-colors hover:border-gold/30 hover:bg-secondary/50 sm:min-w-0"
              >
                <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl", ACCENT_ICON[link.accent])}>
                  <link.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{t(link.labelKey)}</p>
                  <p className="truncate text-xs text-muted">
                    {link.stat == null
                      ? t("admin.openInbox")
                      : loading
                        ? "—"
                        : `${stats[link.stat]} ${link.stat === "totalUsers" || link.stat === "activeTrades" ? t("admin.itemsTotal") : t("admin.itemsPending")}`}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
              </Link>
            ))}
          </div>
        </AdminPanel>
      </FadeIn>

      <FadeIn>
        <AdminPanel title={t("admin.systemStatus")} description={t("admin.systemStatusDesc")}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-xl border border-border bg-background/30 px-3.5 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald shadow-[0_0_10px_rgba(16,185,129,0.6)]" />
              <div className="min-w-0">
                <p className="text-xs text-muted">{t("admin.statusTrading")}</p>
                <p className="text-sm font-medium text-emerald">{t("admin.statusOnline")}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-border bg-background/30 px-3.5 py-3">
              <ArrowDownToLine className="h-4 w-4 text-sky-400" />
              <div className="min-w-0">
                <p className="text-xs text-muted">{t("admin.statusDeposits")}</p>
                <p className="text-sm font-medium text-foreground">{stats.pendingDeposits} {t("admin.pending")}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-border bg-background/30 px-3.5 py-3">
              <Bell className="h-4 w-4 text-muted" />
              <div className="min-w-0">
                <p className="text-xs text-muted">{t("admin.activeTrades")}</p>
                <p className="text-sm font-medium text-foreground">{stats.activeTrades}</p>
              </div>
            </div>
            <Link
              to="/dashboard/admin/trades"
              className="flex items-center gap-3 rounded-xl border border-border bg-background/30 px-3.5 py-3 transition-colors hover:border-gold/30"
            >
              <TrendingUp className="h-4 w-4 text-gold" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted">{t("admin.trades")}</p>
                <p className="text-sm font-medium text-gold">{t("admin.manageTrades")}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted" />
            </Link>
          </div>
        </AdminPanel>
      </FadeIn>
    </div>
  );
}
