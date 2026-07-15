import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { ensureValidSession } from "@/lib/auth-session";
import { isKycApproved, formatTransactionError } from "@/lib/kyc";
import { KycRequiredGate } from "@/components/dashboard/KycRequiredGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { DashboardSheet } from "@/components/dashboard/DashboardSheet";

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
  const { user, profile } = useAuth();
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
    if (!isKycApproved(profile)) {
      setMessage(t("kyc.required"));
      return;
    }
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
      setMessage(
        formatTransactionError(
          error,
          error.message.includes("Insufficient") ? t("copyTrading.insufficientBalance") : error.message,
          t("kyc.required")
        )
      );
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
      <KycRequiredGate>
      <p className="text-sm text-muted">{t("copyTrading.balance")}: <span className="font-semibold text-emerald">{formatCurrency(balance)}</span></p>

      <div className="grid gap-4 md:grid-cols-3">
        {traders.map((tr) => (
          <div
            key={tr.name}
            className={cn("dashboard-stat", selectedTrader === tr.name && "border-emerald/40 ring-1 ring-emerald/25")}
          >
            <p className="font-display text-lg font-semibold">{tr.name}</p>
            <p className="mt-2 text-2xl font-bold text-emerald">{tr.return}</p>
            <Badge variant="secondary" className="mt-2">{t(`copyTrading.risk.${tr.risk}`)}</Badge>
            <Button variant="outline" size="sm" className="mt-4 w-full rounded-full" onClick={() => setSelectedTrader(tr.name)}>
              {t("copyTrading.select")}
            </Button>
          </div>
        ))}
      </div>

      {selectedTrader && (
        <DashboardSheet>
          <h2 className="mb-4 font-display text-base font-semibold">{t("copyTrading.subscribeTo", { name: selectedTrader })}</h2>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Label>{t("copyTrading.allocation")}</Label>
              <Input type="number" min={100} value={allocation} onChange={(e) => setAllocation(e.target.value)} className="mt-2" />
            </div>
            <Button className="rounded-full" onClick={handleSubscribe} disabled={loading}>{loading ? t("common.saving") : t("copyTrading.subscribe")}</Button>
          </div>
        </DashboardSheet>
      )}

      {message && <p className={cn("text-sm", message === t("copyTrading.subscribed") ? "text-emerald" : "text-amber-400")}>{message}</p>}
      </KycRequiredGate>

      {subs.length > 0 && (
        <DashboardSheet>
          <h2 className="mb-4 font-display text-base font-semibold">{t("copyTrading.activeSubs")}</h2>
          <div className="space-y-2">
            {subs.map((s) => (
              <div key={s.id} className="dashboard-row border-b border-border/40 px-0">
                <span className="text-sm">{s.trader_name}</span>
                <span className="ml-auto text-sm">{formatCurrency(s.allocation)} <Badge variant="success">{s.status}</Badge></span>
              </div>
            ))}
          </div>
        </DashboardSheet>
      )}
    </div>
  );
}
