import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Trade } from "@/types/database";

interface PositionsPanelProps {
  openTrades: Trade[];
  historyTrades: Trade[];
}

export function PositionsPanel({ openTrades, historyTrades }: PositionsPanelProps) {
  const { t } = useTranslation();

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02]">
      <Tabs defaultValue="open">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 pt-4">
          <h2 className="font-display font-semibold text-foreground">{t("trading.positions")}</h2>
          <TabsList className="h-9 rounded-lg bg-white/[0.04] p-0.5">
            <TabsTrigger value="open" className="rounded-md text-xs">
              {t("trading.openTab")} ({openTrades.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-md text-xs">
              {t("trading.historyTab")} ({historyTrades.length})
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="open" className="mt-0 p-4">
          {openTrades.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">{t("trading.noOpenPositions")}</p>
          ) : (
            <TradeTable trades={openTrades} />
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-0 p-4">
          {historyTrades.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">{t("trading.noHistory")}</p>
          ) : (
            <TradeTable trades={historyTrades} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TradeTable({ trades }: { trades: Trade[] }) {
  const { t } = useTranslation();

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/[0.06] text-left text-xs text-muted">
            <th className="pb-3 pr-4 font-medium">{t("trading.asset")}</th>
            <th className="pb-3 pr-4 font-medium">{t("trading.side")}</th>
            <th className="pb-3 pr-4 font-medium">{t("trading.qty")}</th>
            <th className="pb-3 pr-4 font-medium">{t("trading.entry")}</th>
            <th className="pb-3 pr-4 font-medium">{t("common.status")}</th>
            <th className="pb-3 font-medium">{t("common.date")}</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((tr) => (
            <tr key={tr.id} className="border-b border-white/[0.04]">
              <td className="py-3 pr-4 font-medium">{tr.asset}</td>
              <td className="py-3 pr-4">
                <Badge variant={tr.type === "buy" ? "success" : "destructive"}>
                  {tr.type.toUpperCase()}
                </Badge>
              </td>
              <td className="py-3 pr-4 text-muted">{tr.amount.toFixed(6)}</td>
              <td className="py-3 pr-4">{formatCurrency(tr.price)}</td>
              <td className="py-3 pr-4">
                <Badge variant={tr.status === "completed" ? "success" : "warning"}>{tr.status}</Badge>
              </td>
              <td className="py-3 text-muted">{formatDate(tr.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
