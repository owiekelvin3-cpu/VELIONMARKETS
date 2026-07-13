import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { Logo, LogoIcon } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, ArrowDownToLine, ArrowUpFromLine, TrendingUp, History,
  Copy, Pickaxe, Radio, FileCheck, LogOut, Menu, Shield, Search, CandlestickChart, Bot, Settings,
} from "@/lib/icons";
import { UserAvatar } from "@/components/settings/UserAvatar";
import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/layout/LanguageSelector";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { NotificationToast } from "@/components/notifications/NotificationToast";
import { PushNotificationInit } from "@/components/notifications/PushNotificationInit";
import { PageEnter } from "@/components/motion/Motion";
import { syncUserLocation } from "@/lib/user-location";

type NavLink = {
  href: string;
  labelKey: string;
  icon: typeof LayoutDashboard;
};

const navGroups: { labelKey: string; links: NavLink[] }[] = [
  {
    labelKey: "dashboard.navGroupTrade",
    links: [
      { href: "/dashboard", labelKey: "dashboard.overview", icon: LayoutDashboard },
      { href: "/dashboard/trading-room", labelKey: "dashboard.tradingRoom", icon: CandlestickChart },
      { href: "/dashboard/ai-trading", labelKey: "dashboard.aiTrading", icon: Bot },
    ],
  },
  {
    labelKey: "dashboard.navGroupCash",
    links: [
      { href: "/dashboard/deposits", labelKey: "dashboard.deposits", icon: ArrowDownToLine },
      { href: "/dashboard/withdrawals", labelKey: "dashboard.withdrawals", icon: ArrowUpFromLine },
      { href: "/dashboard/transactions", labelKey: "dashboard.transactions", icon: History },
    ],
  },
  {
    labelKey: "dashboard.navGroupProducts",
    links: [
      { href: "/dashboard/trades", labelKey: "dashboard.trades", icon: TrendingUp },
      { href: "/dashboard/copy-trading", labelKey: "dashboard.copyTrading", icon: Copy },
      { href: "/dashboard/mining", labelKey: "dashboard.mining", icon: Pickaxe },
      { href: "/dashboard/signals", labelKey: "dashboard.signals", icon: Radio },
    ],
  },
  {
    labelKey: "dashboard.navGroupAccount",
    links: [
      { href: "/dashboard/kyc", labelKey: "dashboard.kyc", icon: FileCheck },
    ],
  },
];

function isLinkActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/dashboard/trading-room") {
    return pathname.startsWith("/dashboard/trading");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardLayout() {
  const { t } = useTranslation();
  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const settingsActive = location.pathname === "/dashboard/settings";

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim().toLowerCase();
    if (!q) return;
    if (q.includes("transaction") || q.includes("history")) navigate("/dashboard/transactions");
    else if (q.includes("deposit")) navigate("/dashboard/deposits");
    else if (q.includes("withdraw")) navigate("/dashboard/withdrawals");
    else if (q.includes("ai") || q.includes("bot")) navigate("/dashboard/ai-trading");
    else if (q.includes("trade") || q.includes("chart")) navigate("/dashboard/trading-room");
    else if (q.includes("copy")) navigate("/dashboard/copy-trading");
    else if (q.includes("min")) navigate("/dashboard/mining");
    else if (q.includes("signal")) navigate("/dashboard/signals");
    else if (q.includes("kyc") || q.includes("verify")) navigate("/dashboard/kyc");
    else if (q.includes("setting")) navigate("/dashboard/settings");
    else navigate("/dashboard/trades");
    setSidebarOpen(false);
  }, [searchQuery, navigate]);

  useEffect(() => {
    if (!user?.id) return;
    void syncUserLocation(user.id);
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void syncUserLocation(user.id);
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [user?.id]);

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-background">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[15.5rem] flex-col border-r border-border bg-void transition-transform duration-300 lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-label={t("dashboard.navLabel")}
      >
        <div className="border-b border-border px-4 py-4">
          <Link to="/dashboard" className="block">
            <Logo size="sm" wordmarkClassName="text-sm" />
          </Link>
          <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
            {t("dashboard.clientPortal")}
          </p>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-2.5 py-4">
          {navGroups.map((group) => (
            <div key={group.labelKey}>
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                {t(group.labelKey)}
              </p>
              <div className="space-y-0.5">
                {group.links.map((link) => {
                  const active = isLinkActive(location.pathname, link.href);
                  return (
                    <Link
                      key={link.href}
                      to={link.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
                        active
                          ? "nav-item-active"
                          : "text-muted hover:bg-secondary/50 hover:text-foreground"
                      )}
                    >
                      <link.icon className="h-4 w-4 shrink-0 opacity-80" aria-hidden="true" />
                      {t(link.labelKey)}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {profile?.role === "admin" && (
            <Link
              to="/dashboard/admin"
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-gold hover:bg-gold/10"
            >
              <Shield className="h-4 w-4" aria-hidden="true" />
              {t("nav.adminPanel")}
            </Link>
          )}
        </nav>

        <div className="border-t border-border p-3">
          <Link
            to="/dashboard/settings"
            onClick={() => setSidebarOpen(false)}
            className={cn(
              "mb-2 flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
              settingsActive
                ? "nav-item-active"
                : "text-muted hover:bg-secondary/50 hover:text-foreground"
            )}
          >
            <Settings className="h-4 w-4 shrink-0" aria-hidden="true" />
            {t("dashboard.settings")}
          </Link>
          <div className="mb-2 flex items-center gap-2.5 rounded-lg border border-border bg-secondary/30 px-2.5 py-2">
            <UserAvatar
              size="sm"
              name={profile?.full_name}
              avatarUrl={profile?.avatar_url}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {profile?.full_name || t("common.investor")}
              </p>
              <p className="truncate text-[11px] text-muted">{profile?.email}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="w-full" onClick={signOut}>
            <LogOut className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
            {t("common.signOut")}
          </Button>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label={t("dashboard.closeSidebar")}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur-xl md:px-6">
          <button
            type="button"
            className="rounded-lg p-2 text-muted hover:bg-secondary lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label={t("dashboard.openSidebar")}
          >
            <Menu className="h-5 w-5" />
          </button>

          <form onSubmit={handleSearch} className="relative hidden min-w-0 flex-1 md:block">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("dashboard.searchPlaceholder")}
              className="h-9 w-full max-w-md rounded-lg border border-border bg-secondary/40 pl-9 pr-3 text-sm text-foreground placeholder:text-muted focus:border-border focus:outline-none focus:ring-1 focus:ring-emerald/20"
            />
          </form>

          <div className="ml-auto flex items-center gap-0.5">
            <ThemeToggle />
            <LanguageSelector />
            <NotificationBell />
            <LogoIcon className="ml-1 hidden h-7 w-7 sm:block lg:hidden" />
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-7">
          <div className="dashboard-shell">
            <PageEnter key={location.pathname}>
              <Outlet />
            </PageEnter>
          </div>
        </main>
      </div>
      <NotificationToast />
      <PushNotificationInit />
    </div>
  );
}
