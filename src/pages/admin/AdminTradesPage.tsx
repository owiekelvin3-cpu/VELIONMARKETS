import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabase";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { UserSelect } from "@/components/admin/UserSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { formatCurrency, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Trade } from "@/types/database";

type TradeRow = Trade & {
  profiles?: { email: string | null; full_name: string | null } | null;
};

export default function AdminTradesPage() {
  const { t } = useTranslation();
  const [trades, setTrades] = useState<TradeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [userId, setUserId] = useState("");
  const [asset, setAsset] = useState("BTC/USDT");
  const [type, setType] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("");
  const [price, setPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [profitTradeId, setProfitTradeId] = useState<string | null>(null);
  const [profitAmount, setProfitAmount] = useState("");
  const [profitNote, setProfitNote] = useState("");
  const [profitBusy, setProfitBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from("trades")
      .select("*, profiles:user_id(email, full_name)")
      .order("created_at", { ascending: false });
    if (err) setError(err.message);
    else setTrades((data as TradeRow[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");
    const { error: err } = await supabase.from("trades").insert({
      user_id: userId,
      asset,
      type,
      amount: parseFloat(amount),
      price: parseFloat(price),
      status: "completed",
    });
    if (err) setError(err.message);
    else {
      setAmount("");
      setPrice("");
      setUserId("");
      setSuccess(t("admin.tradeCreated"));
      await load();
    }
    setSubmitting(false);
  };

  const addProfit = async (tradeId: string) => {
    const amt = parseFloat(profitAmount);
    if (!Number.isFinite(amt) || amt <= 0) {
      setError(t("admin.profitAmountInvalid"));
      return;
    }
    setProfitBusy(true);
    setError("");
    setSuccess("");
    const { data, error: err } = await supabase.rpc("admin_add_trade_profit", {
      p_trade_id: tradeId,
      p_amount: amt,
      p_note: profitNote.trim() || null,
    });
    if (err) {
      setError(err.message);
    } else {
      setSuccess(
        t("admin.profitAdded", {
          amount: formatCurrency(amt),
          balance: formatCurrency(Number((data as { balance_after?: number })?.balance_after ?? 0)),
        })
      );
      setProfitTradeId(null);
      setProfitAmount("");
      setProfitNote("");
      await load();
    }
    setProfitBusy(false);
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader title={t("admin.tradesTitle")} subtitle={t("admin.tradesSubtitle")} />

      {error && (
        <p className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">{error}</p>
      )}
      {success && (
        <p className="rounded-lg border border-emerald/30 bg-emerald/10 px-4 py-3 text-sm text-emerald">{success}</p>
      )}

      <AdminPanel title={t("admin.createTrade")}>
        <form onSubmit={createTrade} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <Label>{t("admin.selectUser")}</Label>
            <UserSelect value={userId} onChange={setUserId} className="mt-2" />
          </div>
          <div>
            <Label>{t("admin.asset")}</Label>
            <Input value={asset} onChange={(e) => setAsset(e.target.value)} required className="mt-2" />
          </div>
          <div>
            <Label>{t("admin.type")}</Label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as "buy" | "sell")}
              className="select-input mt-2 h-11 w-full"
            >
              <option value="buy">{t("admin.buy")}</option>
              <option value="sell">{t("admin.sell")}</option>
            </select>
          </div>
          <div>
            <Label>{t("admin.amount")}</Label>
            <Input
              type="number"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="mt-2"
            />
          </div>
          <div>
            <Label>{t("admin.price")}</Label>
            <Input
              type="number"
              step="any"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              className="mt-2"
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={submitting || !userId}>
              {t("admin.create")}
            </Button>
          </div>
        </form>
      </AdminPanel>

      <AdminPanel title={t("admin.allTrades")}>
        {loading ? (
          <LoadingScreen />
        ) : trades.length === 0 ? (
          <p className="text-sm text-muted">{t("admin.noTrades")}</p>
        ) : (
          <div className="space-y-3">
            {trades.map((trade) => {
              const canProfit = trade.status === "completed" || trade.status === "approved";
              const open = profitTradeId === trade.id;
              const userLabel =
                trade.profiles?.full_name || trade.profiles?.email || trade.user_id.slice(0, 8);

              return (
                <div key={trade.id} className="rounded-lg border border-border bg-secondary/50 px-4 py-3 text-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-1">
                      <p className="font-medium text-foreground">
                        {trade.type.toUpperCase()} {trade.asset} — {trade.amount} @{" "}
                        {formatCurrency(trade.price)}
                      </p>
                      <p className="text-xs text-muted">
                        {userLabel} · {formatDate(trade.created_at)}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <StatusBadge status={trade.status} />
                        <span
                          className={cn(
                            "text-xs font-medium",
                            (trade.profit ?? 0) > 0 ? "text-emerald" : "text-muted"
                          )}
                        >
                          {t("admin.tradeProfit")}:{" "}
                          {(trade.profit ?? 0) > 0 ? `+${formatCurrency(trade.profit)}` : "—"}
                        </span>
                      </div>
                    </div>
                    {canProfit && (
                      <Button
                        type="button"
                        size="sm"
                        variant={open ? "outline" : "default"}
                        onClick={() => {
                          setProfitTradeId(open ? null : trade.id);
                          setProfitAmount("");
                          setProfitNote("");
                          setError("");
                        }}
                      >
                        {open ? t("common.cancel") : t("admin.addProfit")}
                      </Button>
                    )}
                  </div>

                  {open && (
                    <div className="mt-3 grid gap-3 border-t border-border pt-3 sm:grid-cols-[1fr_1fr_auto]">
                      <div>
                        <Label htmlFor={`profit-${trade.id}`}>{t("admin.profitAmount")}</Label>
                        <Input
                          id={`profit-${trade.id}`}
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={profitAmount}
                          onChange={(e) => setProfitAmount(e.target.value)}
                          placeholder="0.00"
                          className="mt-1.5"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`note-${trade.id}`}>{t("admin.profitNote")}</Label>
                        <Input
                          id={`note-${trade.id}`}
                          value={profitNote}
                          onChange={(e) => setProfitNote(e.target.value)}
                          placeholder={t("admin.profitNotePlaceholder")}
                          className="mt-1.5"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          type="button"
                          disabled={profitBusy}
                          onClick={() => void addProfit(trade.id)}
                          className="w-full sm:w-auto"
                        >
                          {profitBusy ? t("common.loading") : t("admin.creditProfit")}
                        </Button>
                      </div>
                      <p className="text-xs text-muted sm:col-span-3">{t("admin.profitHint")}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </AdminPanel>
    </div>
  );
}
