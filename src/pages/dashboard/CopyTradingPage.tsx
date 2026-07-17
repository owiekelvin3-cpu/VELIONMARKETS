import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { ensureValidSession } from "@/lib/auth-session";
import { isKycApproved, formatTransactionError } from "@/lib/kyc";
import { KycRequiredGate } from "@/components/dashboard/KycRequiredGate";
import { ProductNotice } from "@/components/dashboard/ProductNotice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { convertFromUsd } from "@/lib/currency";
import { DashboardSheet } from "@/components/dashboard/DashboardSheet";
import { COPY_STRATEGIES, type CopyStrategy } from "@/constants/products";
import { ArrowDownToLine } from "@/lib/icons";

interface Subscription {
  id: string;
  trader_name: string;
  allocation: number;
  status: string;
  created_at: string;
}

export default function CopyTradingPage() {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [balance, setBalance] = useState(0);
  const [selected, setSelected] = useState<CopyStrategy | null>(null);
  const [allocation, setAllocation] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    await ensureValidSession();
    const [subRes, balRes] = await Promise.all([
      supabase
        .from("copy_trading_subscriptions")
        .select("id, trader_name, allocation, status, created_at")
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

  const amount = parseFloat(allocation);
  const activeNames = useMemo(
    () => new Set(subs.filter((s) => s.status === "active").map((s) => s.trader_name)),
    [subs]
  );

  const handleSubscribe = async () => {
    if (!user || !selected) return;
    if (!isKycApproved(profile)) {
      setMessage(t("kyc.required"));
      setIsSuccess(false);
      return;
    }
    const minAllocation = selected ? convertFromUsd(selected.minAllocation) : 0;
    if (!amount || amount < minAllocation) {
      setMessage(t("copyTrading.minAllocation", { amount: formatCurrency(minAllocation) }));
      setIsSuccess(false);
      return;
    }
    if (amount > balance) {
      setMessage(t("copyTrading.insufficientBalance"));
      setIsSuccess(false);
      return;
    }
    if (activeNames.has(selected.name)) {
      setMessage(t("copyTrading.alreadyActive"));
      setIsSuccess(false);
      return;
    }
    if (!confirming) {
      setConfirming(true);
      setMessage("");
      return;
    }

    setLoading(true);
    setMessage("");
    setIsSuccess(false);
    const { error } = await supabase.from("copy_trading_subscriptions").insert({
      user_id: user.id,
      trader_name: selected.name,
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
      setIsSuccess(false);
    } else {
      setIsSuccess(true);
      setMessage(t("copyTrading.subscribed"));
      setAllocation("");
      setConfirming(false);
      setSelected(null);
      await load();
    }
    setLoading(false);
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        eyebrow={t("copyTrading.eyebrow")}
        title={t("copyTrading.title")}
        subtitle={t("copyTrading.subtitle")}
        actions={
          <div className="rounded-full border border-border bg-card px-3.5 py-2 text-sm">
            <span className="text-muted">{t("copyTrading.balance")}</span>
            <span className="ml-2 font-semibold text-emerald">{formatCurrency(balance)}</span>
          </div>
        }
      />

      <div className="grid gap-3 lg:grid-cols-2">
        <ProductNotice title={t("copyTrading.howItWorksTitle")} body={t("copyTrading.howItWorksBody")} />
        <ProductNotice variant="risk" title={t("copyTrading.riskTitle")} body={t("copyTrading.riskBody")} />
      </div>

      <KycRequiredGate>
        <div className="grid gap-3 md:grid-cols-3">
          {COPY_STRATEGIES.map((tr) => {
            const isSelected = selected?.id === tr.id;
            const already = activeNames.has(tr.name);
            return (
              <button
                key={tr.id}
                type="button"
                onClick={() => {
                  setSelected(tr);
                  setConfirming(false);
                  setMessage("");
                  setAllocation(String(convertFromUsd(tr.minAllocation)));
                }}
                className={cn(
                  "rounded-2xl border bg-card p-4 text-left transition-colors",
                  isSelected ? "border-emerald/45 ring-1 ring-emerald/25" : "border-border/70 hover:border-emerald/25"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-display text-lg font-semibold text-foreground">{tr.name}</p>
                  <Badge variant="secondary">{t(`copyTrading.risk.${tr.risk}`)}</Badge>
                </div>
                <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                  {t("copyTrading.sampleLabel")}
                </p>
                <p className="mt-1 font-display text-xl font-semibold text-foreground">{tr.sampleRange}</p>
                <p className="mt-1 text-[11px] text-muted">{t("copyTrading.sampleHint")}</p>
                <div className="mt-4 space-y-1.5 text-xs text-muted">
                  <p>
                    <span className="text-foreground/80">{t("copyTrading.focusLabel")}: </span>
                    {t(tr.focusKey)}
                  </p>
                  <p>
                    <span className="text-foreground/80">{t("copyTrading.styleLabel")}: </span>
                    {t(tr.styleKey)}
                  </p>
                </div>
                <p className="mt-4 text-xs font-medium text-emerald">
                  {already
                    ? t("copyTrading.alreadyActive")
                    : isSelected
                      ? t("copyTrading.selected")
                      : t("copyTrading.select")}
                </p>
              </button>
            );
          })}
        </div>

        {selected && (() => {
          const minAllocation = convertFromUsd(selected.minAllocation);
          return (
          <DashboardSheet className="mt-4">
            <h2 className="font-display text-base font-semibold">
              {t("copyTrading.subscribeTo", { name: selected.name })}
            </h2>
            <p className="mt-1 text-xs text-muted">
              {t("copyTrading.minAllocation", { amount: formatCurrency(minAllocation) })}
            </p>

            {confirming ? (
              <div className="mt-4 space-y-4">
                <ProductNotice
                  variant="risk"
                  title={t("copyTrading.confirmTitle")}
                  body={t("copyTrading.confirmBody", {
                    amount: formatCurrency(amount || 0),
                    name: selected.name,
                  })}
                />
                <div className="flex flex-wrap gap-2">
                  <Button className="rounded-full" disabled={loading} onClick={() => void handleSubscribe()}>
                    {loading ? t("common.saving") : t("copyTrading.subscribe")}
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-full"
                    disabled={loading}
                    onClick={() => setConfirming(false)}
                  >
                    {t("copyTrading.cancel")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <Label htmlFor="copy-allocation">{t("copyTrading.allocation")}</Label>
                  <Input
                    id="copy-allocation"
                    type="number"
                    min={minAllocation}
                    value={allocation}
                    onChange={(e) => setAllocation(e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {balance < minAllocation && (
                    <Button variant="outline" className="rounded-full" asChild>
                      <Link to="/dashboard/deposits">
                        <ArrowDownToLine className="h-3.5 w-3.5" />
                        {t("dashboard.deposits")}
                      </Link>
                    </Button>
                  )}
                  <Button
                    className="rounded-full"
                    disabled={loading || activeNames.has(selected.name)}
                    onClick={() => void handleSubscribe()}
                  >
                    {t("copyTrading.subscribe")}
                  </Button>
                </div>
              </div>
            )}
          </DashboardSheet>
          );
        })()}

        {message && (
          <p className={cn("mt-3 text-sm", isSuccess ? "text-emerald" : "text-amber-400")}>{message}</p>
        )}
      </KycRequiredGate>

      <DashboardSheet>
        <h2 className="mb-4 font-display text-base font-semibold">{t("copyTrading.activeSubs")}</h2>
        {subs.length === 0 ? (
          <p className="text-sm text-muted">{t("copyTrading.noSubs")}</p>
        ) : (
          <div className="divide-y divide-border/50">
            {subs.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">{s.trader_name}</p>
                  <p className="text-xs text-muted">{formatDate(s.created_at)}</p>
                </div>
                <p className="font-semibold tabular-nums">{formatCurrency(s.allocation)}</p>
                <Badge variant={s.status === "active" ? "success" : "secondary"}>
                  {t(`copyTrading.status.${s.status}`, { defaultValue: s.status })}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </DashboardSheet>
    </div>
  );
}
