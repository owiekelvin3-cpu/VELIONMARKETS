import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { ensureValidSession } from "@/lib/auth-session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

const signalPackages = [
  { name: "Basic Signals", price: 49, duration: "30 days", signals: "5/day" },
  { name: "Pro Signals", price: 149, duration: "30 days", signals: "15/day" },
  { name: "VIP Signals", price: 399, duration: "30 days", signals: "Unlimited" },
];

interface SignalSub {
  id: string;
  package_name: string;
  price: number;
  status: string;
  expires_at: string | null;
}

export default function SignalsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [subs, setSubs] = useState<SignalSub[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const load = async () => {
    if (!user) return;
    await ensureValidSession();
    const [subRes, balRes] = await Promise.all([
      supabase.from("signal_packages").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("balances").select("amount").eq("user_id", user.id).single(),
    ]);
    setSubs(subRes.data ?? []);
    setBalance(balRes.data?.amount ?? 0);
  };

  useEffect(() => { load(); }, [user]);

  const handlePurchase = async (pkg: typeof signalPackages[0]) => {
    if (!user) return;
    if (pkg.price > balance) {
      setMessage(t("signals.insufficientBalance"));
      return;
    }
    setLoading(pkg.name);
    setMessage("");
    const expires = new Date();
    expires.setDate(expires.getDate() + 30);
    const { error } = await supabase.from("signal_packages").insert({
      user_id: user.id,
      package_name: pkg.name,
      price: pkg.price,
      status: "active",
      expires_at: expires.toISOString(),
    });
    if (error) {
      setMessage(error.message.includes("Insufficient") ? t("signals.insufficientBalance") : error.message);
    } else {
      setMessage(t("signals.subscribed", { name: pkg.name }));
      await load();
    }
    setLoading(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t("signals.title")} subtitle={t("signals.subtitle")} />
      <p className="text-sm text-muted">{t("signals.balance")}: <span className="font-semibold text-emerald">{formatCurrency(balance)}</span></p>

      <div className="grid gap-4 md:grid-cols-3">
        {signalPackages.map((pkg) => (
          <Card key={pkg.name}>
            <CardHeader><CardTitle>{pkg.name}</CardTitle></CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(pkg.price)}<span className="text-sm text-muted">/mo</span></p>
              <p className="mt-2 text-sm text-muted">{pkg.signals}</p>
              <Button size="sm" className="mt-4 w-full" disabled={loading === pkg.name || balance < pkg.price} onClick={() => handlePurchase(pkg)}>
                {loading === pkg.name ? t("common.saving") : t("signals.subscribe")}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {message && <p className={cn("text-sm", message.includes("subscribed") || message.includes("Subscribed") ? "text-emerald" : "text-amber-400")}>{message}</p>}

      {subs.length > 0 && (
        <Card>
          <CardHeader><CardTitle>{t("signals.activeSubs")}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {subs.map((s) => (
              <div key={s.id} className="flex justify-between border-b pb-2 text-sm">
                <span>{s.package_name}</span>
                <div className="text-right">
                  <Badge variant="success">{s.status}</Badge>
                  {s.expires_at && <p className="mt-1 text-xs text-muted">{t("signals.expires")} {formatDate(s.expires_at)}</p>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
