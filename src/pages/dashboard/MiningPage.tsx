import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { ensureValidSession } from "@/lib/auth-session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

const packages = [
  { name: "Starter", investment: 500, dailyReturn: 0.8, hashrate: "10 TH/s" },
  { name: "Professional", investment: 2500, dailyReturn: 1.2, hashrate: "50 TH/s" },
  { name: "Enterprise", investment: 10000, dailyReturn: 1.8, hashrate: "200 TH/s" },
];

interface MiningSub {
  id: string;
  package_name: string;
  investment: number;
  daily_return: number;
  status: string;
}

export default function MiningPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [subs, setSubs] = useState<MiningSub[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const load = async () => {
    if (!user) return;
    await ensureValidSession();
    const [subRes, balRes] = await Promise.all([
      supabase.from("mining_packages").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("balances").select("amount").eq("user_id", user.id).single(),
    ]);
    setSubs(subRes.data ?? []);
    setBalance(balRes.data?.amount ?? 0);
  };

  useEffect(() => { load(); }, [user]);

  const handlePurchase = async (pkg: typeof packages[0]) => {
    if (!user) return;
    if (pkg.investment > balance) {
      setMessage(t("mining.insufficientBalance"));
      return;
    }
    setLoading(pkg.name);
    setMessage("");
    setIsSuccess(false);
    const { error } = await supabase.from("mining_packages").insert({
      user_id: user.id,
      package_name: pkg.name,
      investment: pkg.investment,
      daily_return: pkg.dailyReturn,
      status: "active",
    });
    if (error) {
      setMessage(error.message.includes("Insufficient") ? t("mining.insufficientBalance") : error.message);
    } else {
      setIsSuccess(true);
      setMessage(t("mining.purchased", { name: pkg.name }));
      await load();
    }
    setLoading(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t("mining.title")} subtitle={t("mining.subtitle")} />
      <p className="text-sm text-muted">{t("mining.balance")}: <span className="font-semibold text-emerald">{formatCurrency(balance)}</span></p>

      <div className="grid gap-4 md:grid-cols-3">
        {packages.map((pkg) => (
          <Card key={pkg.name}>
            <CardHeader><CardTitle>{pkg.name}</CardTitle></CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(pkg.investment)}</p>
              <p className="mt-1 text-sm text-muted">{pkg.hashrate}</p>
              <p className="mt-2 font-semibold text-emerald">{pkg.dailyReturn}% {t("mining.daily")}</p>
              <Button size="sm" className="mt-4 w-full" disabled={loading === pkg.name || balance < pkg.investment} onClick={() => handlePurchase(pkg)}>
                {loading === pkg.name ? t("common.saving") : t("mining.purchase")}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {message && <p className={cn("text-sm", isSuccess ? "text-emerald" : "text-amber-400")}>{message}</p>}

      {subs.length > 0 && (
        <Card>
          <CardHeader><CardTitle>{t("mining.yourPackages")}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {subs.map((s) => (
              <div key={s.id} className="flex justify-between border-b pb-2 text-sm">
                <span>{s.package_name} — {formatCurrency(s.investment)}</span>
                <Badge variant="success">{s.status} ({s.daily_return}%/{t("mining.day")})</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
