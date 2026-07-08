import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowRight, Building2, Coins, Globe2, Sparkles, Wallet, Zap,
} from "@/lib/icons";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/dashboard/DepositIcons";
import { EwalletProviderIcon } from "@/components/dashboard/WithdrawIcons";
import { CRYPTO_ASSETS } from "@/constants/deposit-assets";
import { EWALLET_PROVIDERS } from "@/constants/withdrawal-methods";

type Accent = "emerald" | "blue" | "indigo" | "gold";

function SectionShell({
  icon: Icon,
  accent,
  title,
  subtitle,
  badge,
  children,
  footer,
}: {
  icon: typeof Coins;
  accent: Accent;
  title: string;
  subtitle: string;
  badge: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const styles: Record<Accent, { badge: string; icon: string; glow: string; link: string }> = {
    emerald: {
      badge: "border-emerald/25 bg-emerald/10 text-emerald",
      icon: "bg-emerald/10 text-emerald",
      glow: "from-emerald/8 via-transparent to-transparent",
      link: "text-emerald hover:text-emerald/80",
    },
    blue: {
      badge: "border-blue-500/25 bg-blue-500/10 text-blue-400",
      icon: "bg-blue-500/10 text-blue-400",
      glow: "from-blue-500/8 via-transparent to-transparent",
      link: "text-blue-400 hover:text-blue-300",
    },
    indigo: {
      badge: "border-indigo-500/25 bg-indigo-500/10 text-indigo-400",
      icon: "bg-indigo-500/10 text-indigo-400",
      glow: "from-indigo-500/8 via-transparent to-transparent",
      link: "text-indigo-400 hover:text-indigo-300",
    },
    gold: {
      badge: "border-gold/25 bg-gold/10 text-gold",
      icon: "bg-gold/10 text-gold",
      glow: "from-gold/8 via-transparent to-transparent",
      link: "text-gold hover:text-gold/80",
    },
  };
  const s = styles[accent];

  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
      <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br", s.glow)} />
      <div className="relative border-b border-white/[0.06] px-5 py-5 sm:px-6">
        <div className="flex gap-4">
          <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", s.icon)}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider", s.badge)}>
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              {badge}
            </span>
            <h2 className="mt-2 font-display text-lg font-semibold text-foreground sm:text-xl">{title}</h2>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted">{subtitle}</p>
          </div>
        </div>
      </div>
      <div className="relative p-5 sm:p-6">{children}</div>
      {footer && (
        <div className="relative border-t border-white/[0.06] px-5 py-4 sm:px-6">
          <div className={cn("inline-flex items-center gap-2 text-sm font-medium", s.link)}>{footer}</div>
        </div>
      )}
    </section>
  );
}

function FiatMethodCard({
  to,
  icon: Icon,
  title,
  description,
  timing,
  accent,
}: {
  to: string;
  icon: typeof Building2;
  title: string;
  description: string;
  timing: string;
  accent: "blue" | "indigo";
}) {
  const ring = accent === "blue" ? "hover:border-blue-500/30 hover:shadow-[0_0_24px_rgba(59,130,246,0.08)]" : "hover:border-indigo-500/30 hover:shadow-[0_0_24px_rgba(99,102,241,0.08)]";
  const iconBg = accent === "blue" ? "bg-blue-500/10 text-blue-400" : "bg-indigo-500/10 text-indigo-400";

  return (
    <Link
      to={to}
      className={cn(
        "group flex flex-col rounded-xl border border-white/[0.06] bg-[#0a0a0c]/60 p-5 transition-all duration-200",
        "hover:bg-white/[0.04]",
        ring
      )}
    >
      <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl", iconBg)}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <h3 className="mt-4 font-display text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1 flex-1 text-xs leading-relaxed text-muted">{description}</p>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-[11px] text-muted">{timing}</span>
        <ArrowRight className="h-4 w-4 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
      </div>
    </Link>
  );
}

export function WithdrawFundsShowcase() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted/70">
          {t("withdrawals.quickWithdraw")}
        </span>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      <SectionShell
        icon={Coins}
        accent="emerald"
        badge={t("withdrawals.cryptoBadge")}
        title={t("withdrawals.cryptoQuickTitle")}
        subtitle={t("withdrawals.cryptoQuickDesc")}
        footer={
          <Link to="/dashboard/withdrawals/crypto" className="inline-flex items-center gap-2">
            {t("withdrawals.viewAllCrypto")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {CRYPTO_ASSETS.map((asset) => (
            <Link
              key={asset.id}
              to={`/dashboard/withdrawals/crypto?coin=${asset.id}`}
              className={cn(
                "group flex flex-col items-center rounded-xl border border-white/[0.06] bg-[#0a0a0c]/60 p-4 text-center transition-all duration-200",
                "hover:border-emerald/30 hover:bg-white/[0.04] hover:shadow-[0_0_24px_rgba(16,185,129,0.08)]"
              )}
            >
              <BrandLogo src={asset.iconUrl} alt={asset.label} size="md" />
              <p className="mt-3 font-display text-sm font-semibold text-foreground">{asset.symbol}</p>
              <p className="mt-0.5 text-xs text-muted">{asset.label}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-emerald opacity-0 transition-opacity group-hover:opacity-100">
                <Zap className="h-3 w-3" aria-hidden="true" />
                {t("withdrawals.withdrawNow")}
              </span>
            </Link>
          ))}
        </div>
      </SectionShell>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionShell
          icon={Building2}
          accent="blue"
          badge={t("withdrawals.fiatBadge")}
          title={t("withdrawals.bankWireTitle")}
          subtitle={t("withdrawals.bankWireDesc")}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <FiatMethodCard
              to="/dashboard/withdrawals/bank"
              icon={Building2}
              title={t("withdrawals.bankTitle")}
              description={t("withdrawals.bankDesc")}
              timing={t("withdrawals.bankTiming")}
              accent="blue"
            />
            <FiatMethodCard
              to="/dashboard/withdrawals/wire"
              icon={Globe2}
              title={t("withdrawals.wireTitle")}
              description={t("withdrawals.wireDesc")}
              timing={t("withdrawals.wireTiming")}
              accent="indigo"
            />
          </div>
        </SectionShell>

        <SectionShell
          icon={Wallet}
          accent="gold"
          badge={t("withdrawals.ewalletBadge")}
          title={t("withdrawals.ewalletQuickTitle")}
          subtitle={t("withdrawals.ewalletQuickDesc")}
          footer={
            <Link to="/dashboard/withdrawals/ewallet" className="inline-flex items-center gap-2">
              {t("withdrawals.viewAllEwallets")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          }
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {EWALLET_PROVIDERS.map((provider) => (
              <Link
                key={provider.id}
                to={`/dashboard/withdrawals/ewallet?provider=${provider.id}`}
                className={cn(
                  "group flex flex-col items-center rounded-xl border border-white/[0.06] bg-[#0a0a0c]/60 p-4 text-center transition-all duration-200",
                  "hover:border-gold/30 hover:bg-white/[0.04] hover:shadow-[0_0_24px_rgba(201,162,39,0.08)]"
                )}
              >
                <EwalletProviderIcon provider={provider} />
                <p className="mt-2 text-xs font-medium text-foreground">{provider.label}</p>
              </Link>
            ))}
          </div>
        </SectionShell>
      </div>
    </div>
  );
}

export function WithdrawalProcessingTimeline() {
  const { t } = useTranslation();

  const items = [
    { label: t("withdrawals.cryptoTitle"), time: t("withdrawals.cryptoTiming"), accent: "text-emerald" },
    { label: t("withdrawals.bankTitle"), time: t("withdrawals.bankTiming"), accent: "text-blue-400" },
    { label: t("withdrawals.wireTitle"), time: t("withdrawals.wireTiming"), accent: "text-indigo-400" },
    { label: t("withdrawals.ewalletTitle"), time: t("withdrawals.ewalletTiming"), accent: "text-gold" },
  ];

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
      <h3 className="font-display text-sm font-semibold text-foreground">{t("withdrawals.processingTimes")}</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3"
          >
            <span className="text-sm text-muted">{item.label}</span>
            <span className={cn("text-sm font-medium", item.accent)}>{item.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
