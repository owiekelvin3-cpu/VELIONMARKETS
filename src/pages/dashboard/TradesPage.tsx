import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { ensureValidSession } from "@/lib/auth-session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Trade } from "@/types/database";

export default function TradesPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      await ensureValidSession();
      const { data, error: err } = await supabase
        .from("trades")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (err) setError(err.message);
      setTrades(data ?? []);
      setLoading(false);
    };
    load();
  }, [user]);

  return (
    <div className="space-y-6">
      <PageHeader title={t("tradesPage.title")} subtitle={t("tradesPage.subtitle")} />
      <Card>
        <CardHeader><CardTitle>{t("tradesPage.allTrades")}</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted">{t("common.loading")}…</p>
          ) : error ? (
            <p className="text-sm text-red-400">{error}</p>
          ) : trades.length === 0 ? (
            <p className="text-sm text-muted">{t("tradesPage.empty")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th>{t("tradesPage.asset")}</th>
                    <th>{t("tradesPage.type")}</th>
                    <th>{t("tradesPage.amount")}</th>
                    <th>{t("tradesPage.price")}</th>
                    <th>{t("common.status")}</th>
                    <th>{t("tradesPage.date")}</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((tr) => (
                    <tr key={tr.id}>
                      <td className="font-medium">{tr.asset}</td>
                      <td>
                        <Badge variant={tr.type === "buy" ? "success" : "destructive"}>{tr.type.toUpperCase()}</Badge>
                      </td>
                      <td>{Number(tr.amount).toFixed(6)}</td>
                      <td>{formatCurrency(tr.price)}</td>
                      <td><Badge variant="secondary">{tr.status}</Badge></td>
                      <td>{formatDate(tr.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
