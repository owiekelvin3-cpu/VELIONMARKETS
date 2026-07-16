import { useTranslation } from "react-i18next";
import { formatCurrency, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Trade, TradeProfitCredit } from "@/types/database";

interface TradingProfitPanelProps {
  realizedProfit: number;
  unrealizedPnl: number;
  credits: TradeProfitCredit[];
  tradesWithProfit: Trade[];
}

export function TradingProfitPanel({
  realizedProfit,
  unrealizedPnl,
  credits,
  tradesWithProfit,
}: TradingProfitPanelProps) {
  const { t } = useTranslation();
  const total = realizedProfit + unrealizedPnl;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <h2 className="font-display text-sm font-semibold text-foreground">{t("trading.profitTitle")}</h2>
        <p className="mt-0.5 text-xs text-muted">{t("trading.profitSubtitle")}</p>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-3">
        <Stat
          label={t("trading.realizedProfit")}
          value={formatCurrency(realizedProfit)}
          tone={realizedProfit > 0 ? "up" : "neutral"}
          hint={t("trading.realizedProfitHint")}
        />
        <Stat
          label={t("trading.unrealizedPnl")}
          value={`${unrealizedPnl >= 0 ? "+" : ""}${formatCurrency(unrealizedPnl)}`}
          tone={unrealizedPnl > 0 ? "up" : unrealizedPnl < 0 ? "down" : "neutral"}
          hint={t("trading.unrealizedHint")}
        />
        <Stat
          label={t("trading.totalPnl")}
          value={`${total >= 0 ? "+" : ""}${formatCurrency(total)}`}
          tone={total > 0 ? "up" : total < 0 ? "down" : "neutral"}
          hint={t("trading.totalPnlHint")}
        />
      </div>

      <div className="border-t border-border px-4 py-3">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
          {t("trading.profitCredits")}
        </p>
        {credits.length === 0 && tradesWithProfit.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted">
            {t("trading.noProfitYet")}
          </p>
        ) : (
          <div className="space-y-2">
            {credits.slice(0, 8).map((c) => {
              const trade = tradesWithProfit.find((tr) => tr.id === c.trade_id);
              return (
                <div
                  key={c.id}
                  className="flex flex-col gap-1 rounded-lg border border-border bg-secondary/40 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {trade
                        ? `${trade.type.toUpperCase()} ${trade.asset}`
                        : t("trading.profitCredit")}
                    </p>
                    {c.note && <p className="mt-0.5 text-xs text-muted">{c.note}</p>}
                    <p className="mt-0.5 text-[11px] text-muted">{formatDate(c.created_at)}</p>
                  </div>
                  <p className="shrink-0 font-display text-sm font-semibold text-emerald">
                    +{formatCurrency(c.amount)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
  hint,
}: {
  label: string;
  value: string;
  tone: "up" | "down" | "neutral";
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-secondary/30 px-3.5 py-3">
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted">{label}</p>
      <p
        className={cn(
          "mt-1 font-display text-xl font-semibold tracking-tight",
          tone === "up" && "text-emerald",
          tone === "down" && "text-red-400",
          tone === "neutral" && "text-foreground"
        )}
      >
        {value}
      </p>
      <p className="mt-1 text-[11px] leading-relaxed text-muted">{hint}</p>
    </div>
  );
}
