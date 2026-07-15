import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { ensureValidSession, formatAuthError } from "@/lib/auth-session";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { DashboardSheet } from "@/components/dashboard/DashboardSheet";
import { Bot, CandlestickChart } from "@/lib/icons";
import { LoadingScreen } from "@/components/ui/loading-screen";
import type { Trade } from "@/types/database";

type TradeRow = {
  id: string;
  source: "manual" | "ai";
  asset: string;
  side: "buy" | "sell" | "ai";
  size: number;
  price: number | null;
  profit: number | null;
  status: string;
  created_at: string;
};

function statusVariant(status: string): "success" | "warning" | "destructive" | "secondary" {
  if (status === "completed" || status === "approved" || status === "active") return "success";
  if (status === "pending") return "warning";
  if (status === "rejected" || status === "cancelled") return "destructive";
  return "secondary";
}

export default function TradesPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [rows, setRows] = useState<TradeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      await ensureValidSession();
      const [manualRes, aiRes] = await Promise.all([
        supabase
          .from("trades")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(100),
        supabase
          .from("ai_bot_trades")
          .select("id, crypto_asset, trade_amount, profit, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(100),
      ]);

      if (manualRes.error) throw manualRes.error;
      if (aiRes.error) throw aiRes.error;

      const manual: TradeRow[] = ((manualRes.data ?? []) as Trade[]).map((tr) => ({
        id: `m-${tr.id}`,
        source: "manual",
        asset: tr.asset,
        side: tr.type,
        size: Number(tr.amount),
        price: Number(tr.price),
        profit: null,
        status: tr.status,
        created_at: tr.created_at,
      }));

      const ai: TradeRow[] = (aiRes.data ?? []).map((tr) => ({
        id: `a-${tr.id}`,
        source: "ai",
        asset: tr.crypto_asset,
        side: "ai",
        size: Number(tr.trade_amount),
        price: null,
        profit: Number(tr.profit),
        status: "completed",
        created_at: tr.created_at,
      }));

      setRows(
        [...manual, ...ai].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      );
    } catch (err) {
      setError(formatAuthError(err, t("dashboard.loadError")));
    } finally {
      setLoading(false);
    }
  }, [user, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = useMemo(
    () => ({
      total: rows.length,
      pending: rows.filter((r) => r.status === "pending").length,
      ai: rows.filter((r) => r.source === "ai").length,
    }),
    [rows]
  );

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        eyebrow={t("tradesPage.eyebrow")}
        title={t("tradesPage.title")}
        subtitle={t("tradesPage.subtitle")}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="rounded-full" asChild>
              <Link to="/dashboard/trading-room">
                <CandlestickChart className="h-3.5 w-3.5" />
                {t("tradesPage.emptyCta")}
              </Link>
            </Button>
            <Button size="sm" className="rounded-full" asChild>
              <Link to="/dashboard/ai-trading">
                <Bot className="h-3.5 w-3.5" />
                {t("tradesPage.emptyAiCta")}
              </Link>
            </Button>
          </div>
        }
      />

      {!loading && !error && rows.length > 0 && (
        <div className="grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-border/70 bg-border/60">
          {[
            { label: t("tradesPage.allTrades"), value: String(counts.total) },
            { label: t("tradesPage.status.pending"), value: String(counts.pending) },
            { label: t("tradesPage.sourceAi"), value: String(counts.ai) },
          ].map((m) => (
            <div key={m.label} className="bg-card px-3 py-3 sm:px-4 sm:py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">{m.label}</p>
              <p className="mt-1 font-display text-lg font-semibold text-foreground sm:text-xl">{m.value}</p>
            </div>
          ))}
        </div>
      )}

      <DashboardSheet>
        {loading ? (
          <LoadingScreen />
        ) : error ? (
          <div className="space-y-3 py-6 text-center">
            <p className="text-sm text-red-400">{error}</p>
            <Button size="sm" variant="outline" onClick={() => void load()}>
              {t("errors.tryAgain")}
            </Button>
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center">
            <p className="text-sm text-muted">{t("tradesPage.empty")}</p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Button size="sm" className="rounded-full" asChild>
                <Link to="/dashboard/trading-room">{t("tradesPage.emptyCta")}</Link>
              </Button>
              <Button size="sm" variant="outline" className="rounded-full" asChild>
                <Link to="/dashboard/ai-trading">{t("tradesPage.emptyAiCta")}</Link>
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="space-y-2 md:hidden">
              {rows.map((tr) => (
                <div key={tr.id} className="rounded-2xl border border-border/70 bg-secondary/20 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">{tr.asset}</p>
                      <p className="mt-0.5 text-xs text-muted">
                        {tr.source === "ai" ? t("tradesPage.sourceAi") : t("tradesPage.sourceManual")}
                        {" · "}
                        {formatDate(tr.created_at)}
                      </p>
                    </div>
                    <Badge variant={statusVariant(tr.status)}>
                      {t(`tradesPage.status.${tr.status}`, { defaultValue: tr.status })}
                    </Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-sm">
                    <span>
                      {tr.side === "ai"
                        ? t("tradesPage.sourceAi")
                        : (
                          <Badge variant={tr.side === "buy" ? "success" : "destructive"} className="uppercase">
                            {tr.side}
                          </Badge>
                        )}
                    </span>
                    <span className="tabular-nums text-muted">{tr.size}</span>
                    {tr.price != null && <span className="tabular-nums">{formatCurrency(tr.price)}</span>}
                    {tr.profit != null && (
                      <span className="font-medium text-emerald">+{formatCurrency(tr.profit)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th>{t("tradesPage.source")}</th>
                    <th>{t("tradesPage.asset")}</th>
                    <th>{t("tradesPage.type")}</th>
                    <th>{t("tradesPage.amount")}</th>
                    <th>{t("tradesPage.price")}</th>
                    <th>{t("tradesPage.profit")}</th>
                    <th>{t("common.status")}</th>
                    <th>{t("tradesPage.date")}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((tr) => (
                    <tr key={tr.id}>
                      <td>
                        <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", tr.source === "ai" ? "text-gold" : "text-muted")}>
                          {tr.source === "ai" ? <Bot className="h-3.5 w-3.5" /> : <CandlestickChart className="h-3.5 w-3.5" />}
                          {tr.source === "ai" ? t("tradesPage.sourceAi") : t("tradesPage.sourceManual")}
                        </span>
                      </td>
                      <td className="font-medium">{tr.asset}</td>
                      <td>
                        {tr.side === "ai" ? (
                          <span className="text-xs text-muted">—</span>
                        ) : (
                          <Badge variant={tr.side === "buy" ? "success" : "destructive"}>{tr.side.toUpperCase()}</Badge>
                        )}
                      </td>
                      <td className="tabular-nums">{tr.size}</td>
                      <td className="tabular-nums">{tr.price != null ? formatCurrency(tr.price) : "—"}</td>
                      <td className="tabular-nums text-emerald">
                        {tr.profit != null ? `+${formatCurrency(tr.profit)}` : "—"}
                      </td>
                      <td>
                        <Badge variant={statusVariant(tr.status)}>
                          {t(`tradesPage.status.${tr.status}`, { defaultValue: tr.status })}
                        </Badge>
                      </td>
                      <td className="text-muted">{formatDate(tr.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </DashboardSheet>
    </div>
  );
}
