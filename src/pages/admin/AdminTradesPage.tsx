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
import type { Trade } from "@/types/database";

export default function AdminTradesPage() {
  const { t } = useTranslation();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState("");
  const [asset, setAsset] = useState("BTC/USD");
  const [type, setType] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("");
  const [price, setPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await supabase.from("trades").select("*").order("created_at", { ascending: false });
    if (err) setError(err.message);
    else setTrades(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const createTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
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
      await load();
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader title={t("admin.tradesTitle")} subtitle={t("admin.tradesSubtitle")} />

      {error && <p className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">{error}</p>}

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
            <select value={type} onChange={(e) => setType(e.target.value as "buy" | "sell")} className="select-input mt-2 h-11 w-full">
              <option value="buy">{t("admin.buy")}</option>
              <option value="sell">{t("admin.sell")}</option>
            </select>
          </div>
          <div>
            <Label>{t("admin.amount")}</Label>
            <Input type="number" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} required className="mt-2" />
          </div>
          <div>
            <Label>{t("admin.price")}</Label>
            <Input type="number" step="any" value={price} onChange={(e) => setPrice(e.target.value)} required className="mt-2" />
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={submitting}>{t("admin.create")}</Button>
          </div>
        </form>
      </AdminPanel>

      <AdminPanel title={t("admin.allTrades")}>
        {loading ? (
          <LoadingScreen />
        ) : trades.length === 0 ? (
          <p className="text-sm text-muted">{t("admin.noTrades")}</p>
        ) : (
          <div className="space-y-2">
            {trades.map((trade) => (
              <div key={trade.id} className="flex flex-col gap-2 rounded-lg border border-border bg-secondary/50 px-4 py-3 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <span className="min-w-0 break-words font-medium">
                  {trade.type.toUpperCase()} {trade.asset} — {trade.amount} @ {formatCurrency(trade.price)}
                </span>
                <span className="flex flex-wrap items-center gap-2 text-muted">
                  <StatusBadge status={trade.status} />
                  {formatDate(trade.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </AdminPanel>
    </div>
  );
}
