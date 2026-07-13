import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Trade } from "@/types/database";

interface PositionsPanelProps {
  openTrades: Trade[];
  historyTrades: Trade[];
}

export function PositionsPanel({ openTrades, historyTrades }: PositionsPanelProps) {
  const { t } = useTranslation();

  return (
    <div className="overflow-hidden surface-panel">
      <Tabs defaultValue="open">
        <div className="flex flex-col gap-3 border-b border-border px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-base font-semibold text-foreground">{t("trading.positions")}</h2>
          <TabsList className="h-9 w-full rounded-lg bg-secondary/60 p-0.5 sm:w-auto">
            <TabsTrigger value="open" className="flex-1 rounded-md text-xs sm:flex-none sm:px-3">
              {t("trading.openTab")} ({openTrades.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1 rounded-md text-xs sm:flex-none sm:px-3">
              {t("trading.historyTab")} ({historyTrades.length})
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="open" className="mt-0 p-4">
          {openTrades.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border py-12 text-center">
              <p className="text-sm text-muted">{t("trading.noOpenPositions")}</p>
            </div>
          ) : (
            <TradeList trades={openTrades} />
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-0 p-4">
          {historyTrades.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border py-12 text-center">
              <p className="text-sm text-muted">{t("trading.noHistory")}</p>
            </div>
          ) : (
            <TradeList trades={historyTrades} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TradeList({ trades }: { trades: Trade[] }) {
  const { t } = useTranslation();

  return (
    <>
      {/* Mobile cards */}
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
                <p className="text-muted">{t("common.status")}</p>
                <Badge variant={tr.status === "completed" ? "success" : "warning"} className="mt-0.5">
                  {tr.status}
                </Badge>
              </div>
              <div>
                <p className="text-muted">{t("common.date")}</p>
                <p className="mt-0.5 font-medium">{formatDate(tr.created_at)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="data-table w-full text-sm">
          <thead>
            <tr>
              <th>{t("trading.asset")}</th>
              <th>{t("trading.side")}</th>
              <th>{t("trading.qty")}</th>
              <th>{t("trading.entry")}</th>
              <th>{t("common.status")}</th>
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
                <td className="py-3">
                  <Badge variant={tr.status === "completed" ? "success" : "warning"}>{tr.status}</Badge>
                </td>
                <td className={cn("py-3 text-muted")}>{formatDate(tr.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
