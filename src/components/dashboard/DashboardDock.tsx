import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowDownToLine,
  CandlestickChart,
  LayoutDashboard,
  User,
} from "@/lib/icons";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "home", href: "/dashboard", labelKey: "dashboard.dock.home", icon: LayoutDashboard, match: (p: string) => p === "/dashboard" },
  {
    id: "trade",
    href: "/dashboard/trading-room",
    labelKey: "dashboard.dock.trade",
    icon: CandlestickChart,
    match: (p: string) => p.startsWith("/dashboard/trading") || p.startsWith("/dashboard/ai-trading") || p.startsWith("/dashboard/trades"),
  },
  {
    id: "cash",
    href: "/dashboard/deposits",
    labelKey: "dashboard.dock.cash",
    icon: ArrowDownToLine,
    match: (p: string) =>
      p.startsWith("/dashboard/deposits") ||
      p.startsWith("/dashboard/withdrawals") ||
      p.startsWith("/dashboard/transactions"),
  },
  {
    id: "account",
    href: "/dashboard/settings",
    labelKey: "dashboard.dock.account",
    icon: User,
    match: (p: string) =>
      p.startsWith("/dashboard/settings") ||
      p.startsWith("/dashboard/notifications") ||
      p.startsWith("/dashboard/kyc") ||
      p.startsWith("/dashboard/support") ||
      p.startsWith("/dashboard/copy") ||
      p.startsWith("/dashboard/mining") ||
      p.startsWith("/dashboard/signals"),
    opensMenu: true,
  },
] as const;

/** Hide dock on immersive full-screen chat threads. */
export function shouldHideDashboardDock(pathname: string) {
  return pathname.startsWith("/dashboard/support");
}

export function DashboardDock({
  onAccountPress,
}: {
  /** When set, Account opens the full nav sheet instead of navigating. */
  onAccountPress?: () => void;
}) {
  const { t } = useTranslation();
  const { pathname } = useLocation();

  if (shouldHideDashboardDock(pathname)) return null;

  return (
    <nav className="dashboard-dock" aria-label={t("dashboard.navLabel")}>
      <div className="dashboard-dock-inner">
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          const Icon = tab.icon;

          if ("opensMenu" in tab && tab.opensMenu && onAccountPress) {
            return (
              <button
                key={tab.id}
                type="button"
                onClick={onAccountPress}
                className={cn("dashboard-dock-item", active && "dashboard-dock-item-active")}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="mb-0.5 h-5 w-5" aria-hidden="true" />
                <span className="leading-none">{t(tab.labelKey)}</span>
              </button>
            );
          }

          return (
            <Link
              key={tab.id}
              to={tab.href}
              className={cn("dashboard-dock-item", active && "dashboard-dock-item-active")}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="mb-0.5 h-5 w-5" aria-hidden="true" />
              <span className="leading-none">{t(tab.labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
