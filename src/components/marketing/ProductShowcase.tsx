import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, Bot, LineChart, Radio } from "@/lib/icons";
import { FadeIn } from "@/components/motion/Motion";
import { Button } from "@/components/ui/button";
import { Section, SectionHeader, Container } from "@/components/ui/section";
import { cn } from "@/lib/utils";

const features = [
  {
    id: "ai",
    icon: Bot,
    titleKey: "product.aiTitle",
    descKey: "product.aiDesc",
    href: "/auth?mode=register",
    ctaKey: "product.aiCta",
    mock: "ai",
  },
  {
    id: "room",
    icon: LineChart,
    titleKey: "product.roomTitle",
    descKey: "product.roomDesc",
    href: "/trading-room",
    ctaKey: "product.roomCta",
    mock: "room",
  },
  {
    id: "signals",
    icon: Radio,
    titleKey: "product.signalsTitle",
    descKey: "product.signalsDesc",
    href: "/trading-signals",
    ctaKey: "product.signalsCta",
    mock: "signals",
  },
] as const;

function FeatureMock({ type }: { type: "ai" | "room" | "signals" }) {
  if (type === "ai") {
    return (
      <div className="rounded-xl border border-border bg-void/60 p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-semibold text-emerald">Velion Core</span>
          <span className="text-[10px] text-muted">+0.35%/hr</span>
        </div>
        <div className="mb-3 h-2 overflow-hidden rounded-full bg-secondary">
          <div className="h-full w-2/3 rounded-full bg-emerald" />
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {["Small", "Medium", "Big"].map((label) => (
            <div key={label} className="rounded-lg border border-border py-2">
              <p className="text-[10px] text-muted">{label}</p>
              <p className="text-xs font-semibold text-emerald">+profit</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === "signals") {
    return (
      <div className="space-y-2 rounded-xl border border-border bg-void/60 p-4">
        {["BTCUSD Long", "XAUUSD Long", "EURUSD Short"].map((row, i) => (
          <div key={row} className="flex items-center justify-between rounded-lg bg-secondary/40 px-3 py-2">
            <span className="text-xs font-medium">{row}</span>
            <span className={cn("text-[10px] font-semibold", i === 2 ? "text-market-down" : "text-market-up")}>
              {i === 2 ? "SHORT" : "LONG"}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-void/60 p-4">
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="font-semibold">BTC / USD</span>
        <span className="text-market-up">+1.24%</span>
      </div>
      <div className="flex h-28 items-end gap-1">
        {[40, 55, 48, 62, 58, 70, 66, 78, 74, 88, 82, 95].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm bg-emerald/70"
            style={{ height: `${h}%`, opacity: 0.45 + (i % 5) * 0.1 }}
          />
        ))}
      </div>
    </div>
  );
}

export function ProductShowcase() {
  const { t } = useTranslation();

  return (
    <Section variant="elevated">
      <Container>
        <SectionHeader
          eyebrow={t("product.eyebrow")}
          title={t("product.title")}
          subtitle={t("product.subtitle")}
        />

        <div className="space-y-12 md:space-y-16">
          {features.map((f, i) => (
            <FadeIn key={f.id}>
              <div
                className={cn(
                  "grid items-center gap-8 lg:grid-cols-2 lg:gap-14",
                  i % 2 === 1 && "lg:[&>*:first-child]:order-2"
                )}
              >
                <div>
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald/10 text-emerald">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
                    {t(f.titleKey)}
                  </h3>
                  <p className="mt-3 max-w-md text-sm leading-relaxed text-muted md:text-base">
                    {t(f.descKey)}
                  </p>
                  <Button asChild className="mt-6" variant="outline">
                    <Link to={f.href}>
                      {t(f.ctaKey)} <ArrowRight className="ml-1.5 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                <FeatureMock type={f.mock} />
              </div>
            </FadeIn>
          ))}
        </div>
      </Container>
    </Section>
  );
}
