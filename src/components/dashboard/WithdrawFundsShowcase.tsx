import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowRight, Clock, Coins, Sparkles, Zap,
} from "@/lib/icons";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/dashboard/DepositIcons";
import {
  EwalletProviderIcon,
  getMethodStyles,
  WithdrawMethodIcon,
  WithdrawMethodPreview,
} from "@/components/dashboard/WithdrawIcons";
import { CRYPTO_ASSETS } from "@/constants/deposit-assets";
import { EWALLET_PROVIDERS, WITHDRAW_METHODS, type WithdrawMethodId } from "@/constants/withdrawal-methods";

function MethodHeroCard({
  method,
  href,
  title,
  description,
  timing,
}: {
  method: WithdrawMethodId;
  href: string;
  title: string;
  description: string;
  timing: string;
}) {
  const s = getMethodStyles(method);

  return (
    <Link
      to={href}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-5 transition-all duration-300",
        "hover:-translate-y-0.5",
        s.ring
      )}
    >
      <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br opacity-80", s.gradient)} />
      <div className="relative flex items-start justify-between gap-3">
        <WithdrawMethodIcon method={method} />
        <span className={cn(
          "inline-flex items-center gap-1 rounded-full border border-border/80 bg-background/60 px-2.5 py-1 text-[10px] font-medium backdrop-blur-sm",
          s.text
        )}>
          <Clock className="h-3 w-3" />
          {timing}
        </span>
      </div>
      <div className="relative mt-4 flex-1">
        <h3 className="font-display text-base font-semibold text-foreground">{title}</h3>
        <p className="mt-1.5 text-xs leading-relaxed text-muted line-clamp-2">{description}</p>
      </div>
      <div className="relative mt-4 flex items-center justify-between gap-3">
        <WithdrawMethodPreview method={method} />
        <span className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-background/80 transition-all",
          "group-hover:border-transparent group-hover:bg-emerald group-hover:text-black"
        )}>
          <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}

export function WithdrawFundsShowcase() {
  const { t } = useTranslation();

  return (
    <div className="space-y-8">
      <div>
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-emerald" />
          <h2 className="font-display text-lg font-semibold text-foreground">{t("withdrawals.chooseMethod")}</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {WITHDRAW_METHODS.map((m) => (
            <MethodHeroCard
              key={m.id}
              method={m.id}
              href={m.href}
              title={t(m.titleKey)}
              description={t(m.descKey)}
              timing={t(m.timingKey)}
            />
          ))}
        </div>
      </div>

      <section className="rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald/10 text-emerald">
              <Coins className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-foreground">{t("withdrawals.cryptoQuickTitle")}</h3>
              <p className="text-xs text-muted">{t("withdrawals.cryptoQuickDesc")}</p>
            </div>
          </div>
          <Link
            to="/dashboard/withdrawals/crypto"
            className="hidden items-center gap-1 text-xs font-medium text-emerald hover:underline sm:inline-flex"
          >
            {t("withdrawals.viewAllCrypto")}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto p-4 pb-5 scrollbar-none">
          {CRYPTO_ASSETS.map((asset) => (
            <Link
              key={asset.id}
              to={`/dashboard/withdrawals/crypto?coin=${asset.id}`}
              className={cn(
                "group flex min-w-[108px] shrink-0 flex-col items-center rounded-2xl border border-border bg-secondary/30 p-4 text-center transition-all",
                "hover:border-emerald/35 hover:bg-emerald/5 hover:shadow-[0_8px_24px_rgba(16,185,129,0.1)]"
              )}
            >
              <BrandLogo src={asset.iconUrl} alt={asset.label} size="lg" />
              <p className="mt-3 font-display text-sm font-bold text-foreground">{asset.symbol}</p>
              <p className="mt-0.5 text-[10px] text-muted">{asset.label}</p>
              <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-emerald opacity-0 transition-opacity group-hover:opacity-100">
                <Zap className="h-3 w-3" />
                {t("withdrawals.withdrawNow")}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-foreground">{t("withdrawals.ewalletQuickTitle")}</h3>
              <p className="text-xs text-muted">{t("withdrawals.ewalletQuickDesc")}</p>
            </div>
          </div>
          <Link
            to="/dashboard/withdrawals/ewallet"
            className="hidden items-center gap-1 text-xs font-medium text-amber-400 hover:underline sm:inline-flex"
          >
            {t("withdrawals.viewAllEwallets")}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-5">
          {EWALLET_PROVIDERS.map((provider) => (
            <Link
              key={provider.id}
              to={`/dashboard/withdrawals/ewallet?provider=${provider.id}`}
              className={cn(
                "group flex flex-col items-center rounded-2xl border border-border bg-secondary/30 p-4 text-center transition-all",
                "hover:border-amber-500/30 hover:bg-amber-500/5 hover:shadow-[0_8px_24px_rgba(245,158,11,0.08)]"
              )}
            >
              <EwalletProviderIcon provider={provider} size="lg" />
              <p className="mt-3 text-xs font-semibold text-foreground">{provider.label}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

export function WithdrawalProcessingTimeline() {
  const { t } = useTranslation();

  const items: Array<{ method: WithdrawMethodId; label: string; time: string }> = [
    { method: "crypto", label: t("withdrawals.cryptoTitle"), time: t("withdrawals.cryptoTiming") },
    { method: "bank", label: t("withdrawals.bankTitle"), time: t("withdrawals.bankTiming") },
    { method: "wire", label: t("withdrawals.wireTitle"), time: t("withdrawals.wireTiming") },
    { method: "ewallet", label: t("withdrawals.ewalletTitle"), time: t("withdrawals.ewalletTiming") },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <Clock className="h-4 w-4 text-muted" />
        <h3 className="font-display text-sm font-semibold text-foreground">{t("withdrawals.processingTimes")}</h3>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => {
          const s = getMethodStyles(item.method);
          return (
            <div
              key={item.method}
              className="flex items-center gap-3 rounded-xl border border-border bg-secondary/20 px-4 py-3"
            >
              <WithdrawMethodIcon method={item.method} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{item.label}</p>
                <p className={cn("text-xs font-medium", s.text)}>{item.time}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
