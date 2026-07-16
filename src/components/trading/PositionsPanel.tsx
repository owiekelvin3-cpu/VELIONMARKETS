import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/market-api";
import type { Trade } from "@/types/database";
import type { Holding } from "@/types/database";

export interface PositionRow {
  holding: Holding;
  pairLabel: string;
  symbol: string;
  markPrice: number;
  avgEntry: number;
  marketValue: number;
  unrealizedPnl: number;
  unrealizedPct: number;
}

interface PositionsPanelProps {
  positions: PositionRow[];
  historyTrades: Trade[];
  closingAsset: string | null;
  onClose: (asset: string, quantity: number) => void;
}

export function PositionsPanel({
  positions,
  historyTrades,
  closingAsset,
  onClose,
}: PositionsPanelProps) {
  const { t } = useTranslation();

  return (
    <div className="overflow-hidden border-t border-border bg-card">
      <Tabs defaultValue="positions">
        <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-sm font-semibold text-foreground">{t("trading.positions")}</h2>
          <TabsList className="h-9 w-full rounded-lg bg-secondary/60 p-0.5 sm:w-auto">
            <TabsTrigger value="positions" className="flex-1 rounded-md text-xs sm:flex-none sm:px-3">
              {t("trading.holdingsTab")} ({positions.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1 rounded-md text-xs sm:flex-none sm:px-3">
              {t("trading.historyTab")} ({historyTrades.length})
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="positions" className="mt-0 p-4">
          {positions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border py-10 text-center">
              <p className="text-sm text-muted">{t("trading.noHoldings")}</p>
            </div>
          ) : (
            <>
              <div className="space-y-2 md:hidden">
                {positions.map((p) => (
                  <PositionCard
                    key={p.holding.id}
                    position={p}
                    closing={closingAsset === p.holding.asset}
                    onClose={onClose}
                  />
                ))}
              </div>
              <div className="hidden overflow-x-auto md:block">
                <table className="data-table w-full text-sm">
                  <thead>
                    <tr>
                      <th>{t("trading.asset")}</th>
                      <th>{t("trading.qty")}</th>
                      <th>{t("trading.avgEntry")}</th>
                      <th>{t("trading.mark")}</th>
                      <th>{t("trading.marketValue")}</th>
                      <th>{t("trading.unrealizedPnl")}</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {positions.map((p) => {
                      const up = p.unrealizedPnl >= 0;
                      return (
                        <tr key={p.holding.id} className="border-b border-border last:border-0">
                          <td className="py-3 font-medium">{p.pairLabel}</td>
                          <td className="py-3 text-muted">{p.holding.quantity.toFixed(6)}</td>
                          <td className="py-3">
                            {p.avgEntry > 0 ? `$${formatPrice(p.avgEntry, p.symbol)}` : "—"}
                          </td>
                          <td className="py-3">
                            {p.markPrice > 0 ? `$${formatPrice(p.markPrice, p.symbol)}` : "—"}
                          </td>
                          <td className="py-3">{formatCurrency(p.marketValue)}</td>
                          <td className={cn("py-3 font-medium", up ? "text-emerald" : "text-red-400")}>
                            {up ? "+" : ""}
                            {formatCurrency(p.unrealizedPnl)}
                            <span className="ml-1 text-xs opacity-80">
                              ({up ? "+" : ""}
                              {p.unrealizedPct.toFixed(2)}%)
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={closingAsset === p.holding.asset}
                              onClick={() => onClose(p.holding.asset, p.holding.quantity)}
                            >
                              {closingAsset === p.holding.asset
                                ? t("common.loading")
                                : t("trading.closePosition")}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-0 p-4">
          {historyTrades.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border py-10 text-center">
              <p className="text-sm text-muted">{t("trading.noHistory")}</p>
            </div>
          ) : (
            <TradeHistory trades={historyTrades} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PositionCard({
  position: p,
  closing,
  onClose,
}: {
  position: PositionRow;
  closing: boolean;
  onClose: (asset: string, quantity: number) => void;
}) {
  const { t } = useTranslation();
  const up = p.unrealizedPnl >= 0;

  return (
    <div className="rounded-xl border border-border bg-secondary/80 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold">{p.pairLabel}</span>
        <span className={cn("text-sm font-semibold", up ? "text-emerald" : "text-red-400")}>
          {up ? "+" : ""}
          {formatCurrency(p.unrealizedPnl)}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div>
          <p className="text-muted">{t("trading.qty")}</p>
          <p className="mt-0.5 font-medium">{p.holding.quantity.toFixed(6)}</p>
        </div>
        <div>
          <p className="text-muted">{t("trading.marketValue")}</p>
          <p className="mt-0.5 font-medium">{formatCurrency(p.marketValue)}</p>
        </div>
        <div>
          <p className="text-muted">{t("trading.avgEntry")}</p>
          <p className="mt-0.5 font-medium">
            {p.avgEntry > 0 ? `$${formatPrice(p.avgEntry, p.symbol)}` : "—"}
          </p>
        </div>
        <div>
          <p className="text-muted">{t("trading.mark")}</p>
          <p className="mt-0.5 font-medium">
            {p.markPrice > 0 ? `$${formatPrice(p.markPrice, p.symbol)}` : "—"}
          </p>
        </div>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="mt-3 w-full"
        disabled={closing}
        onClick={() => onClose(p.holding.asset, p.holding.quantity)}
      >
        {closing ? t("common.loading") : t("trading.closePosition")}
      </Button>
    </div>
  );
}

function TradeHistory({ trades }: { trades: Trade[] }) {
  const { t } = useTranslation();

  return (
    <>
      <div className="space-y-2 md:hidden">
        {trades.map((tr) => (
          <div key={tr.id} className="rounded-xl border border-border bg-secondary/80 p-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold">{tr.asset}</span>
              <Badge variant={tr.type === "buy" ? "success" : "destructive"}>
                {tr.type.toUpperCase()}
              </Badge>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-muted">{t("trading.qty")}</p>
                <p className="mt-0.5 font-medium">{tr.amount.toFixed(6)}</p>
              </div>
              <div>
                <p className="text-muted">{t("trading.entry")}</p>
                <p className="mt-0.5 font-medium">{formatCurrency(tr.price)}</p>
              </div>
              <div>
                <p className="text-muted">{t("trading.notional")}</p>
                <p className="mt-0.5 font-medium">{formatCurrency(tr.amount * tr.price)}</p>
              </div>
              <div>
                <p className="text-muted">{t("trading.profit")}</p>
                <p className={cn("mt-0.5 font-medium", (tr.profit ?? 0) > 0 ? "text-emerald" : "text-foreground")}>
                  {(tr.profit ?? 0) > 0 ? `+${formatCurrency(tr.profit)}` : "—"}
                </p>
              </div>
              <div>
                <p className="text-muted">{t("common.date")}</p>
                <p className="mt-0.5 font-medium">{formatDate(tr.created_at)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="data-table w-full text-sm">
          <thead>
            <tr>
              <th>{t("trading.asset")}</th>
              <th>{t("trading.side")}</th>
              <th>{t("trading.qty")}</th>
              <th>{t("trading.entry")}</th>
              <th>{t("trading.notional")}</th>
              <th>{t("trading.profit")}</th>
              <th>{t("common.date")}</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((tr) => (
              <tr key={tr.id} className="border-b border-border last:border-0">
                <td className="py-3 font-medium">{tr.asset}</td>
                <td className="py-3">
                  <Badge variant={tr.type === "buy" ? "success" : "destructive"}>
                    {tr.type.toUpperCase()}
                  </Badge>
                </td>
                <td className="py-3 text-muted">{tr.amount.toFixed(6)}</td>
                <td className="py-3">{formatCurrency(tr.price)}</td>
                <td className="py-3">{formatCurrency(tr.amount * tr.price)}</td>
                <td className={cn("py-3 font-medium", (tr.profit ?? 0) > 0 ? "text-emerald" : "text-muted")}>
                  {(tr.profit ?? 0) > 0 ? `+${formatCurrency(tr.profit)}` : "—"}
                </td>
                <td className="py-3 text-muted">{formatDate(tr.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
