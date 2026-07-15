import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, ArrowDownToLine, ArrowUpFromLine, TrendingUp, History,
  Copy, Pickaxe, Radio, FileCheck, LogOut, Menu, Shield, Search, CandlestickChart, Bot, Settings, MessageCircle, X,
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
import { DashboardDock, shouldHideDashboardDock } from "@/components/dashboard/DashboardDock";
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
      { href: "/dashboard/support", labelKey: "dashboard.support", icon: MessageCircle },
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
  const hideDock = shouldHideDashboardDock(location.pathname);
  const isOverview = location.pathname === "/dashboard";

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim().toLowerCase();
    if (!q) return;
    if (q.includes("transaction") || q.includes("history")) navigate("/dashboard/transactions");
    else if (q.includes("deposit") || q.includes("fund")) navigate("/dashboard/deposits");
    else if (q.includes("withdraw") || q.includes("cash out")) navigate("/dashboard/withdrawals");
    else if (q.includes("ai") || q.includes("bot")) navigate("/dashboard/ai-trading");
    else if (q.includes("room") || q.includes("chart") || q.includes("live")) navigate("/dashboard/trading-room");
    else if (q.includes("trade") || q.includes("order")) navigate("/dashboard/trades");
    else if (q.includes("copy")) navigate("/dashboard/copy-trading");
    else if (q.includes("min")) navigate("/dashboard/mining");
    else if (q.includes("signal")) navigate("/dashboard/signals");
    else if (q.includes("kyc") || q.includes("verify")) navigate("/dashboard/kyc");
    else if (q.includes("support") || q.includes("help") || q.includes("ticket") || q.includes("chat")) navigate("/dashboard/support");
    else if (q.includes("setting") || q.includes("profile")) navigate("/dashboard/settings");
    else navigate("/dashboard");
    setSearchQuery("");
    setSidebarOpen(false);
  }, [searchQuery, navigate]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const scrollY = window.scrollY;
    const { style } = document.body;
    const prev = {
      overflow: style.overflow,
      position: style.position,
      top: style.top,
      left: style.left,
      right: style.right,
      width: style.width,
    };
    style.overflow = "hidden";
    style.position = "fixed";
    style.top = `-${scrollY}px`;
    style.left = "0";
    style.right = "0";
    style.width = "100%";
    return () => {
      style.overflow = prev.overflow;
      style.position = prev.position;
      style.top = prev.top;
      style.left = prev.left;
      style.right = prev.right;
      style.width = prev.width;
      window.scrollTo(0, scrollY);
    };
  }, [sidebarOpen]);

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
    <div className="relative flex min-h-dvh w-full max-w-[100vw] overflow-x-hidden bg-background">
      <div className="dashboard-atmosphere" aria-hidden="true" />
      <aside
        className={cn(
          "dashboard-sidebar fixed inset-y-0 left-0 z-50 flex w-[min(18rem,88vw)] flex-col border-r border-border transition-transform duration-300 ease-out lg:static lg:z-auto lg:w-60 lg:translate-x-0 xl:w-64",
          sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0 lg:shadow-none"
        )}
        aria-label={t("dashboard.navLabel")}
      >
        <div className="flex items-start justify-between gap-2 border-b border-border/60 px-4 py-4 pt-[max(1rem,env(safe-area-inset-top))]">
          <div className="min-w-0">
            <Link to="/dashboard" className="block" onClick={() => setSidebarOpen(false)}>
              <Logo size="sm" wordmarkClassName="text-sm" />
            </Link>
            <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald/80">
              {t("dashboard.clientPortal")}
            </p>
          </div>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full text-muted hover:bg-secondary lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label={t("dashboard.closeSidebar")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto overscroll-contain px-3 py-4 [-webkit-overflow-scrolling:touch]">
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
                        "flex min-h-11 items-center gap-2.5 rounded-2xl px-3 py-2.5 text-[13px] font-medium transition-colors",
                        active
                          ? "nav-item-active"
                          : "text-muted hover:bg-secondary/50 hover:text-foreground"
                      )}
                    >
                      <link.icon className="h-4 w-4 shrink-0 opacity-80" aria-hidden="true" />
                      <span className="truncate">{t(link.labelKey)}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {profile?.role === "admin" && (
            <Link
              to="/dashboard/admin"
              onClick={() => setSidebarOpen(false)}
              className="flex min-h-11 items-center gap-2.5 rounded-2xl px-3 py-2.5 text-[13px] font-medium text-gold hover:bg-gold/10"
            >
              <Shield className="h-4 w-4" aria-hidden="true" />
              {t("nav.adminPanel")}
            </Link>
          )}
        </nav>

        <div className="border-t border-border/60 p-3 pb-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.5rem))] lg:pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <Link
            to="/dashboard/settings"
            onClick={() => setSidebarOpen(false)}
            className={cn(
              "mb-2 flex min-h-11 items-center gap-2.5 rounded-2xl px-3 py-2.5 text-[13px] font-medium transition-colors",
              settingsActive
                ? "nav-item-active"
                : "text-muted hover:bg-secondary/50 hover:text-foreground"
            )}
          >
            <Settings className="h-4 w-4 shrink-0" aria-hidden="true" />
            {t("dashboard.settings")}
          </Link>
          <div className="mb-2 flex items-center gap-2.5 rounded-2xl border border-border/70 bg-secondary/25 px-2.5 py-2.5">
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
          <div className="mb-2 flex items-center gap-1 lg:hidden">
            <ThemeToggle />
            <LanguageSelector />
          </div>
          <Button variant="outline" size="sm" className="w-full rounded-full" onClick={signOut}>
            <LogOut className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
            {t("common.signOut")}
          </Button>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-[45] bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label={t("dashboard.closeSidebar")}
        />
      )}

      <div className="relative z-[1] flex min-w-0 w-full flex-1 flex-col">
        <header
          className={cn(
            "sticky top-0 z-20 flex min-h-14 items-center gap-2 px-3 pt-[env(safe-area-inset-top)] sm:gap-3 sm:px-4 md:px-6",
            isOverview
              ? "border-b-0 bg-transparent"
              : "border-b border-border/60 bg-background/80 backdrop-blur-xl"
          )}
        >
          <button
            type="button"
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-full lg:hidden",
              isOverview
                ? "text-white/80 hover:bg-white/10 hover:text-white"
                : "text-muted hover:bg-secondary"
            )}
            onClick={() => setSidebarOpen(true)}
            aria-label={t("dashboard.openSidebar")}
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link
            to="/dashboard/settings"
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full lg:hidden",
              isOverview ? "ring-1 ring-white/25" : "ring-1 ring-border/80"
            )}
            aria-label={t("dashboard.settings")}
          >
            <UserAvatar
              size="sm"
              name={profile?.full_name}
              avatarUrl={profile?.avatar_url}
            />
          </Link>

          <form onSubmit={handleSearch} className="relative hidden min-w-0 flex-1 sm:block">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("dashboard.searchPlaceholder")}
              className="h-10 w-full max-w-md rounded-full border border-border bg-secondary/40 pl-9 pr-3 text-base text-foreground placeholder:text-muted focus:border-emerald/30 focus:outline-none focus:ring-1 focus:ring-emerald/20"
            />
          </form>

      <div className="ml-auto flex shrink-0 items-center gap-0.5">
            <div className="hidden lg:flex lg:items-center lg:gap-0.5">
              <ThemeToggle />
              <LanguageSelector />
            </div>
            <div className={cn(isOverview && "[&_button]:text-white/80 [&_button]:hover:bg-white/10 [&_button]:hover:text-white")}>
              <NotificationBell />
            </div>
          </div>
        </header>

        <main
          className={cn(
            "relative min-w-0 flex-1 overflow-x-hidden p-3 sm:p-4 md:p-6 lg:p-7",
            !hideDock && "pb-dock"
          )}
        >
          <div className="dashboard-shell">
            <PageEnter key={location.pathname}>
              <Outlet />
            </PageEnter>
          </div>
        </main>
      </div>

      {!sidebarOpen && <DashboardDock onAccountPress={() => setSidebarOpen(true)} />}
      <NotificationToast />
      <PushNotificationInit />
    </div>
  );
}
