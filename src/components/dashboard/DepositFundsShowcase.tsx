import { useTranslation } from "react-i18next";
import { ArrowUpRight, Coins, ExternalLink, Gift, HelpCircle, Sparkles } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { useDepositConfig } from "@/hooks/useDepositConfig";
import { getActivePartners } from "@/lib/deposit-config";
import type { PurchasePartner } from "@/constants/purchase-partners";

function SectionShell({
  icon: Icon,
  accent,
  title,
  subtitle,
  badge,
  stepHint,
  children,
}: {
  icon: typeof Coins;
  accent: "emerald" | "gold";
  title: string;
  subtitle: string;
  badge: string;
  stepHint: string;
  children: React.ReactNode;
}) {
  const styles = {
    emerald: {
      badge: "border-emerald/25 bg-emerald/10 text-emerald",
      icon: "bg-emerald/10 text-emerald",
      glow: "from-emerald/8 via-transparent to-transparent",
      step: "text-emerald",
    },
    gold: {
      badge: "border-gold/25 bg-gold/10 text-gold",
      icon: "bg-gold/10 text-gold",
      glow: "from-gold/8 via-transparent to-transparent",
      step: "text-gold",
    },
  }[accent];

  return (
    <section className="relative overflow-hidden rounded-2xl border border-border bg-secondary/50">
      <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br", styles.glow)} />
      <div className="relative border-b border-border px-5 py-5 sm:px-6">
        <div className="flex gap-4">
          <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", styles.icon)}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider", styles.badge)}>
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              {badge}
            </span>
            <h2 className="mt-2 font-display text-lg font-semibold text-foreground sm:text-xl">{title}</h2>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted">{subtitle}</p>
            <p className={cn("mt-3 flex items-center gap-2 text-xs font-medium", styles.step)}>
              <HelpCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {stepHint}
            </p>
          </div>
        </div>
      </div>
      <div className="relative space-y-3 p-5 sm:p-6">{children}</div>
    </section>
  );
}

function PartnerCard({ partner, accent }: { partner: PurchasePartner; accent: "emerald" | "gold" }) {
  const { t } = useTranslation();
  const hoverRing = accent === "emerald"
    ? "hover:border-emerald/30 hover:shadow-[0_0_24px_rgba(16,185,129,0.08)]"
    : "hover:border-gold/30 hover:shadow-[0_0_24px_rgba(201,162,39,0.08)]";
  const linkColor = accent === "emerald" ? "text-emerald group-hover:text-emerald/80" : "text-gold group-hover:text-gold/80";

  return (
    <a
      href={partner.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group flex items-center gap-4 rounded-xl border border-border bg-card/60 p-4 transition-all duration-200",
        "hover:bg-secondary/70",
        hoverRing
      )}
    >
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
        style={{ backgroundColor: partner.color }}
      >
        {partner.logoUrl ? (
          <img src={partner.logoUrl} alt="" className="h-7 w-7 object-contain" loading="lazy" />
        ) : (
          partner.name.slice(0, 2).toUpperCase()
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-display text-sm font-semibold text-foreground">{partner.name}</p>
          {partnerTag(partner, t) && (
            <span className="rounded-full border border-border bg-secondary/70 px-2 py-0.5 text-[10px] font-medium text-muted">
              {partnerTag(partner, t)}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs leading-relaxed text-muted">
          {partner.description ?? (partner.descriptionKey ? t(partner.descriptionKey) : "")}
        </p>
      </div>

      <div className={cn("flex shrink-0 items-center gap-1 text-xs font-medium", linkColor)}>
        <span className="hidden sm:inline">{t("deposits.visitPartner")}</span>
        <ExternalLink className="h-4 w-4" aria-hidden="true" />
      </div>
    </a>
  );
}

function partnerTag(partner: PurchasePartner, t: (key: string) => string) {
  if (partner.tag) return partner.tag;
  if (partner.tagKey) return t(partner.tagKey);
  return null;
}

function BuyCryptoPartners() {
  const { t } = useTranslation();
  const { data: config } = useDepositConfig();
  const partners = getActivePartners(config?.cryptoPartners ?? []);

  return (
    <SectionShell
      icon={Coins}
      accent="emerald"
      badge={t("deposits.buyCryptoBadge")}
      title={t("deposits.buyCryptoTitle")}
      subtitle={t("deposits.buyCryptoDesc")}
      stepHint={t("deposits.buyCryptoStep")}
    >
      {partners.map((partner) => (
        <PartnerCard key={partner.id} partner={partner} accent="emerald" />
      ))}
      <p className="flex items-start gap-2 rounded-lg border border-border bg-secondary/50 px-4 py-3 text-xs leading-relaxed text-muted">
        <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald" aria-hidden="true" />
        {t("deposits.buyCryptoFooter")}
      </p>
    </SectionShell>
  );
}

function BuyGiftCardPartners() {
  const { t } = useTranslation();
  const { data: config } = useDepositConfig();
  const partners = getActivePartners(config?.giftCardPartners ?? []);

  return (
    <SectionShell
      icon={Gift}
      accent="gold"
      badge={t("deposits.giftCardsBadge")}
      title={t("deposits.giftCardsTitle")}
      subtitle={t("deposits.giftCardsDesc")}
      stepHint={t("deposits.giftCardsStep")}
    >
      {partners.map((partner) => (
        <PartnerCard key={partner.id} partner={partner} accent="gold" />
      ))}
      <p className="flex items-start gap-2 rounded-lg border border-border bg-secondary/50 px-4 py-3 text-xs leading-relaxed text-muted">
        <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" aria-hidden="true" />
        {t("deposits.giftCardsFooter")}
      </p>
    </SectionShell>
  );
}

export function DepositFundsShowcase() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted/70">
          {t("deposits.moreOptions")}
        </span>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>
      <BuyCryptoPartners />
      <BuyGiftCardPartners />
    </div>
  );
}
