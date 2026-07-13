import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/world-economy", labelKey: "nav.economy" },
  { href: "/world-economy/trends", labelKey: "nav.economyTrends" },
  { href: "/forex-news", labelKey: "nav.forexNews" },
  { href: "/brokers", labelKey: "nav.brokers" },
] as const;

export function MarketsSubnav() {
  const { t } = useTranslation();
  const { pathname } = useLocation();

  return (
    <div className="-mx-4 mb-8 overflow-x-auto border-b border-border px-4 sm:mx-0 sm:px-0">
      <nav className="flex min-w-max gap-1 pb-px" aria-label={t("economy.subnavLabel")}>
        {LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                "relative px-3.5 py-2.5 text-sm font-medium transition-colors",
                active ? "text-foreground" : "text-muted hover:text-foreground"
              )}
            >
              {t(link.labelKey)}
              {active && (
                <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-emerald" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
