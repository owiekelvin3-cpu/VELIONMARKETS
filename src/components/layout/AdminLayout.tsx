import { Link, useLocation, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { BRAND } from "@/constants/brand";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";
import {
  Users, FileCheck, ArrowDownToLine, ArrowUpFromLine, TrendingUp,
  Settings, Bell, Mail, LogOut, Menu, LayoutDashboard, LayoutGrid, Coins, MessageCircle, X,
} from "@/lib/icons";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/layout/LanguageSelector";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { NotificationToast } from "@/components/notifications/NotificationToast";
import { PushNotificationInit } from "@/components/notifications/PushNotificationInit";
import { PageEnter } from "@/components/motion/Motion";

const adminLinks = [
  { href: "/dashboard/admin", labelKey: "admin.overview", icon: LayoutGrid, exact: true },
  { href: "/dashboard/admin/users", labelKey: "admin.users", icon: Users },
  { href: "/dashboard/admin/kyc", labelKey: "admin.kycReview", icon: FileCheck },
  { href: "/dashboard/admin/deposits", labelKey: "admin.deposits", icon: ArrowDownToLine },
  { href: "/dashboard/admin/deposit-config", labelKey: "admin.depositConfig", icon: Coins },
  { href: "/dashboard/admin/withdrawals", labelKey: "admin.withdrawals", icon: ArrowUpFromLine },
  { href: "/dashboard/admin/trades", labelKey: "admin.trades", icon: TrendingUp },
  { href: "/dashboard/admin/notifications", labelKey: "admin.notifications", icon: Bell },
  { href: "/dashboard/admin/support", labelKey: "admin.support", icon: MessageCircle },
  { href: "/dashboard/admin/email", labelKey: "admin.emailCenter", icon: Mail },
  { href: "/dashboard/admin/settings", labelKey: "admin.settings", icon: Settings },
] as const;

export function AdminLayout() {
  const { t } = useTranslation();
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const initials = profile?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "AD";

  const isActive = (href: string, exact?: boolean) =>
    exact ? location.pathname === href : location.pathname === href || location.pathname.startsWith(`${href}/`);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sidebarOpen]);

  return (
    <div className="flex min-h-dvh w-full max-w-[100vw] overflow-x-hidden bg-background">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[min(18rem,88vw)] flex-col border-r border-border bg-void transition-transform duration-300 ease-out lg:static lg:w-64 lg:translate-x-0",
          sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"
        )}
        aria-label={t("admin.navLabel")}
      >
        <div className="flex h-16 items-center justify-between gap-2 border-b border-border px-4">
          <Link to="/dashboard/admin" className="flex min-w-0 items-center gap-2" onClick={() => setSidebarOpen(false)}>
            <Logo size="sm" wordmarkClassName="text-sm" />
            <span className="rounded-md bg-gold/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold">
              Admin
            </span>
          </Link>
          <button
            type="button"
            className="rounded-lg p-2 text-muted hover:bg-secondary lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label={t("dashboard.closeSidebar")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto overscroll-contain p-3">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
            {t("admin.title")}
          </p>
          {adminLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive(link.href, "exact" in link ? link.exact : false)
                  ? "bg-gold/10 text-gold"
                  : "text-muted hover:bg-secondary/70 hover:text-foreground"
              )}
            >
              <link.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{t(link.labelKey)}</span>
            </Link>
          ))}
        </nav>

        <div className="border-t border-border p-3">
          <Link
            to="/dashboard"
            onClick={() => setSidebarOpen(false)}
            className="mb-3 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-secondary/70 hover:text-foreground"
          >
            <LayoutDashboard className="h-4 w-4" />
            {t("admin.backToDashboard")}
          </Link>
          <div className="mb-3 flex items-center gap-3 rounded-lg bg-secondary/60 px-3 py-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold/15 text-xs font-bold text-gold ring-1 ring-gold/20">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{profile?.full_name || "Admin"}</p>
              <p className="truncate text-xs text-muted">{profile?.email}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="w-full border-border bg-transparent" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
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

      <div className="flex min-w-0 w-full flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-border bg-background/90 px-3 backdrop-blur-xl sm:gap-3 sm:px-4 md:px-6">
          <button
            type="button"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-secondary lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label={t("dashboard.openSidebar")}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{BRAND.name}</p>
            <p className="truncate text-xs text-muted">{t("admin.portalLabel")}</p>
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            <ThemeToggle />
            <LanguageSelector />
            <NotificationBell />
          </div>
        </header>

        <main className="min-w-0 flex-1 overflow-x-hidden p-3 sm:p-4 md:p-6 lg:p-8">
          <div className="mx-auto w-full min-w-0 max-w-[1400px]">
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
