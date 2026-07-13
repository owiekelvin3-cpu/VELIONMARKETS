import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { BRAND } from "@/constants/brand";
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

const sidebarLinks = [
  { href: "/dashboard", labelKey: "dashboard.overview", icon: LayoutDashboard },
  { href: "/dashboard/trading-room", labelKey: "dashboard.tradingRoom", icon: CandlestickChart },
  { href: "/dashboard/ai-trading", labelKey: "dashboard.aiTrading", icon: Bot },
  { href: "/dashboard/deposits", labelKey: "dashboard.deposits", icon: ArrowDownToLine },
  { href: "/dashboard/withdrawals", labelKey: "dashboard.withdrawals", icon: ArrowUpFromLine },
  { href: "/dashboard/transactions", labelKey: "dashboard.transactions", icon: History },
  { href: "/dashboard/trades", labelKey: "dashboard.trades", icon: TrendingUp },
  { href: "/dashboard/copy-trading", labelKey: "dashboard.copyTrading", icon: Copy },
  { href: "/dashboard/mining", labelKey: "dashboard.mining", icon: Pickaxe },
  { href: "/dashboard/signals", labelKey: "dashboard.signals", icon: Radio },
  { href: "/dashboard/kyc", labelKey: "dashboard.kyc", icon: FileCheck },
] as const;

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
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-void transition-transform duration-300 lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-label={t("dashboard.navLabel")}
      >
        <div className="flex h-16 items-center border-b border-border px-5">
          <Link to="/dashboard">
            <Logo size="sm" wordmarkClassName="text-sm" />
          </Link>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
            {t("dashboard.menu")}
          </p>
          {sidebarLinks.map((link) => {
            const active = location.pathname === link.href || 
              (link.href === "/dashboard/trading-room" && location.pathname.startsWith("/dashboard/trading")) ||
              (link.href === "/dashboard/ai-trading" && location.pathname.startsWith("/dashboard/ai-trading"));
            return (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-emerald/10 text-emerald"
                    : "text-muted hover:bg-secondary/70 hover:text-foreground"
                )}
              >
                <link.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                {t(link.labelKey)}
              </Link>
            );
          })}
          {profile?.role === "admin" && (
            <Link
              to="/dashboard/admin"
              className="mt-4 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gold hover:bg-gold/10"
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
              "mb-3 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              settingsActive
                ? "bg-emerald/10 text-emerald"
                : "text-muted hover:bg-secondary/70 hover:text-foreground"
            )}
          >
            <Settings className="h-4 w-4 shrink-0" aria-hidden="true" />
            {t("dashboard.settings")}
          </Link>
          <div className="mb-3 flex items-center gap-3 rounded-lg bg-secondary/60 px-3 py-2.5">
            <UserAvatar
              size="sm"
              name={profile?.full_name}
              avatarUrl={profile?.avatar_url}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{profile?.full_name || t("common.investor")}</p>
              <p className="truncate text-xs text-muted">{profile?.email}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="w-full border-border bg-transparent" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
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
        <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border bg-background/90 px-4 backdrop-blur-xl md:px-6">
          <button
            type="button"
            className="rounded-lg p-2 text-muted hover:bg-secondary lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label={t("dashboard.openSidebar")}
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="hidden flex-1 md:block">
            <form onSubmit={handleSearch} className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("dashboard.searchPlaceholder")}
                className="h-10 w-full rounded-lg border border-border bg-secondary/60 pl-10 pr-4 text-sm text-foreground placeholder:text-muted focus:border-emerald/30 focus:outline-none focus:ring-1 focus:ring-emerald/20"
              />
            </form>
          </div>

          <div className="ml-auto flex items-center gap-1">
            <span className="mr-2 hidden text-xs text-muted sm:inline">{BRAND.name}</span>
            <ThemeToggle />
            <LanguageSelector />
            <NotificationBell />
            <LogoIcon className="hidden h-8 w-8 sm:block lg:hidden" />
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <PageEnter key={location.pathname}>
            <Outlet />
          </PageEnter>
        </main>
      </div>
      <NotificationToast />
      <PushNotificationInit />
    </div>
  );
}
