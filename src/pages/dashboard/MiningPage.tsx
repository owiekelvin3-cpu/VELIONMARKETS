import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { ensureValidSession } from "@/lib/auth-session";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { DashboardSheet } from "@/components/dashboard/DashboardSheet";
import { KycRequiredGate } from "@/components/dashboard/KycRequiredGate";
import { ProductNotice } from "@/components/dashboard/ProductNotice";
import { isKycApproved, formatTransactionError } from "@/lib/kyc";
import { MINING_PACKAGES, type MiningPackage } from "@/constants/products";
import { ArrowDownToLine } from "@/lib/icons";

interface MiningSub {
  id: string;
  package_name: string;
  investment: number;
  daily_return: number;
  status: string;
  created_at: string;
}

export default function MiningPage() {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const [subs, setSubs] = useState<MiningSub[]>([]);
  const [balance, setBalance] = useState(0);
  const [pending, setPending] = useState<MiningPackage | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    await ensureValidSession();
    const [subRes, balRes] = await Promise.all([
      supabase
        .from("mining_packages")
        .select("id, package_name, investment, daily_return, status, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase.from("balances").select("amount").eq("user_id", user.id).single(),
    ]);
    setSubs(subRes.data ?? []);
    setBalance(Number(balRes.data?.amount ?? 0));
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const requestPurchase = (pkg: MiningPackage) => {
    setMessage("");
    setIsSuccess(false);
    if (!isKycApproved(profile)) {
      setMessage(t("kyc.required"));
      return;
    }
    if (pkg.investment > balance) {
      setMessage(t("mining.insufficientBalance"));
      return;
    }
    setPending(pkg);
  };

  const confirmPurchase = async () => {
    if (!user || !pending) return;
    setLoading(pending.id);
    setMessage("");
    setIsSuccess(false);
    const name = t(pending.nameKey);
    const { error } = await supabase.from("mining_packages").insert({
      user_id: user.id,
      package_name: name,
      investment: pending.investment,
      daily_return: pending.dailyReturnEstimate,
      status: "active",
    });
    if (error) {
      setMessage(
        formatTransactionError(
          error,
          error.message.includes("Insufficient") ? t("mining.insufficientBalance") : error.message,
          t("kyc.required")
        )
      );
      setIsSuccess(false);
    } else {
      setIsSuccess(true);
      setMessage(t("mining.purchased", { name }));
      setPending(null);
      await load();
    }
    setLoading(null);
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        eyebrow={t("mining.eyebrow")}
        title={t("mining.title")}
        subtitle={t("mining.subtitle")}
        actions={
          <div className="rounded-full border border-border bg-card px-3.5 py-2 text-sm">
            <span className="text-muted">{t("mining.balance")}</span>
            <span className="ml-2 font-semibold text-emerald">{formatCurrency(balance)}</span>
          </div>
        }
      />

      <div className="grid gap-3 lg:grid-cols-2">
        <ProductNotice title={t("mining.howItWorksTitle")} body={t("mining.howItWorksBody")} />
        <ProductNotice variant="risk" title={t("mining.riskTitle")} body={t("mining.riskBody")} />
      </div>

      <KycRequiredGate>
        <div className="grid gap-3 md:grid-cols-3">
          {MINING_PACKAGES.map((pkg) => {
            const name = t(pkg.nameKey);
            const canAfford = balance >= pkg.investment;
            return (
              <div key={pkg.id} className="rounded-2xl border border-border/70 bg-card p-4">
                <p className="font-display text-lg font-semibold text-foreground">{name}</p>
                <p className="mt-3 font-display text-2xl font-semibold tracking-tight">
                  {formatCurrency(pkg.investment)}
                </p>
                <dl className="mt-4 space-y-2 text-xs text-muted">
                  <div className="flex justify-between gap-3">
                    <dt>{t("mining.hashrateLabel")}</dt>
                    <dd className="font-medium text-foreground">{pkg.hashrate}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt>{t("mining.termLabel")}</dt>
                    <dd className="font-medium text-foreground">{t("mining.termDays", { days: pkg.termDays })}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt>{t("mining.estimateLabel")}</dt>
                    <dd className="font-medium text-foreground">
                      ~{pkg.dailyReturnEstimate}% {t("mining.daily")}
                    </dd>
                  </div>
                </dl>
                <p className="mt-2 text-[11px] text-muted">{t("mining.estimateHint")}</p>
                <Button
                  size="sm"
                  className="mt-4 w-full rounded-full"
                  disabled={loading === pkg.id}
                  onClick={() => requestPurchase(pkg)}
                >
                  {loading === pkg.id ? t("common.saving") : t("mining.purchase")}
                </Button>
                {!canAfford && (
                  <Button variant="ghost" size="sm" className="mt-1 w-full text-xs" asChild>
                    <Link to="/dashboard/deposits">
                      <ArrowDownToLine className="h-3.5 w-3.5" />
                      {t("dashboard.deposits")}
                    </Link>
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {pending && (
          <DashboardSheet className="mt-4">
            <ProductNotice
              variant="risk"
              title={t("mining.confirmTitle")}
              body={t("mining.confirmBody", {
                amount: formatCurrency(pending.investment),
                name: t(pending.nameKey),
              })}
            />
            <div className="mt-4 flex flex-wrap gap-2">
              <Button className="rounded-full" disabled={!!loading} onClick={() => void confirmPurchase()}>
                {loading ? t("common.saving") : t("mining.purchase")}
              </Button>
              <Button
                variant="outline"
                className="rounded-full"
                disabled={!!loading}
                onClick={() => setPending(null)}
              >
                {t("mining.cancel")}
              </Button>
            </div>
          </DashboardSheet>
        )}

        {message && (
          <p className={cn("mt-3 text-sm", isSuccess ? "text-emerald" : "text-amber-400")}>{message}</p>
        )}
      </KycRequiredGate>

      <DashboardSheet>
        <h2 className="mb-4 font-display text-base font-semibold">{t("mining.yourPackages")}</h2>
        {subs.length === 0 ? (
          <p className="text-sm text-muted">{t("mining.noPackages")}</p>
        ) : (
          <div className="divide-y divide-border/50">
            {subs.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">
                    {s.package_name} — {formatCurrency(s.investment)}
                  </p>
                  <p className="text-xs text-muted">
                    {formatDate(s.created_at)} · ~{s.daily_return}% /{t("mining.day")} ({t("mining.estimateHint")})
                  </p>
                </div>
                <Badge variant={s.status === "active" ? "success" : "secondary"}>
                  {t(`mining.status.${s.status}`, { defaultValue: s.status })}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </DashboardSheet>
    </div>
  );
}
