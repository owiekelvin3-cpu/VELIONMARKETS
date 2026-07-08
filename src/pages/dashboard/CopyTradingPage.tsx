import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { ensureValidSession } from "@/lib/auth-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Subscription {
  id: string;
  trader_name: string;
  allocation: number;
  status: string;
  created_at: string;
}

const traders = [
  { name: "Alex Mercer", return: "+24.5%", risk: "medium" as const },
  { name: "Diana Brooks", return: "+18.2%", risk: "low" as const },
  { name: "Marcus Chen", return: "+31.7%", risk: "high" as const },
];

export default function CopyTradingPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [balance, setBalance] = useState(0);
  const [selectedTrader, setSelectedTrader] = useState("");
  const [allocation, setAllocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const load = async () => {
    if (!user) return;
    await ensureValidSession();
    const [subRes, balRes] = await Promise.all([
      supabase.from("copy_trading_subscriptions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("balances").select("amount").eq("user_id", user.id).single(),
    ]);
    setSubs(subRes.data ?? []);
    setBalance(balRes.data?.amount ?? 0);
  };

  useEffect(() => { load(); }, [user]);

  const handleSubscribe = async () => {
    if (!user || !selectedTrader) return;
    const amount = parseFloat(allocation);
    if (!amount || amount < 100) {
      setMessage(t("copyTrading.minAllocation", { amount: formatCurrency(100) }));
      return;
    }
    if (amount > balance) {
      setMessage(t("copyTrading.insufficientBalance"));
      return;
    }

    setLoading(true);
    setMessage("");
    const { error } = await supabase.from("copy_trading_subscriptions").insert({
      user_id: user.id,
      trader_name: selectedTrader,
      allocation: amount,
      status: "active",
    });

    if (error) {
      setMessage(error.message.includes("Insufficient") ? t("copyTrading.insufficientBalance") : error.message);
    } else {
      setMessage(t("copyTrading.subscribed"));
      setAllocation("");
      await load();
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t("copyTrading.title")} subtitle={t("copyTrading.subtitle")} />
      <p className="text-sm text-muted">{t("copyTrading.balance")}: <span className="font-semibold text-emerald">{formatCurrency(balance)}</span></p>

      <div className="grid gap-4 md:grid-cols-3">
        {traders.map((tr) => (
          <Card key={tr.name} className={selectedTrader === tr.name ? "ring-1 ring-emerald/30" : ""}>
            <CardHeader>
              <CardTitle className="text-lg">{tr.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-emerald">{tr.return}</p>
              <Badge variant="secondary" className="mt-2">{t(`copyTrading.risk.${tr.risk}`)}</Badge>
              <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => setSelectedTrader(tr.name)}>
                {t("copyTrading.select")}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedTrader && (
        <Card>
          <CardHeader><CardTitle>{t("copyTrading.subscribeTo", { name: selectedTrader })}</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Label>{t("copyTrading.allocation")}</Label>
              <Input type="number" min={100} value={allocation} onChange={(e) => setAllocation(e.target.value)} className="mt-2" />
            </div>
            <Button onClick={handleSubscribe} disabled={loading}>{loading ? t("common.saving") : t("copyTrading.subscribe")}</Button>
          </CardContent>
        </Card>
      )}

      {message && <p className={cn("text-sm", message === t("copyTrading.subscribed") ? "text-emerald" : "text-amber-400")}>{message}</p>}

      {subs.length > 0 && (
        <Card>
          <CardHeader><CardTitle>{t("copyTrading.activeSubs")}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {subs.map((s) => (
              <div key={s.id} className="flex justify-between border-b pb-2 text-sm">
                <span>{s.trader_name}</span>
                <span>{formatCurrency(s.allocation)} <Badge variant="success">{s.status}</Badge></span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
