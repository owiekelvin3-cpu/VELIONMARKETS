import { useCallback, useEffect, useMemo, useState } from "react";
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
import { SIGNAL_PACKAGES, type SignalPackage } from "@/constants/products";
import { ArrowDownToLine, Bell, CandlestickChart, Check } from "@/lib/icons";

interface SignalSub {
  id: string;
  package_name: string;
  price: number;
  status: string;
  expires_at: string | null;
  created_at: string;
}

function isSubActive(sub: SignalSub) {
  if (sub.status !== "active") return false;
  if (!sub.expires_at) return true;
  return new Date(sub.expires_at).getTime() > Date.now();
}

export default function SignalsPage() {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const [subs, setSubs] = useState<SignalSub[]>([]);
  const [balance, setBalance] = useState(0);
  const [pending, setPending] = useState<SignalPackage | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    await ensureValidSession();
    const [subRes, balRes] = await Promise.all([
      supabase
        .from("signal_packages")
        .select("id, package_name, price, status, expires_at, created_at")
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

  const hasActive = useMemo(() => subs.some(isSubActive), [subs]);

  const requestSubscribe = (pkg: SignalPackage) => {
    setMessage("");
    setIsSuccess(false);
    if (!isKycApproved(profile)) {
      setMessage(t("kyc.required"));
      return;
    }
    if (pkg.price > balance) {
      setMessage(t("signals.insufficientBalance"));
      return;
    }
    setPending(pkg);
  };

  const confirmSubscribe = async () => {
    if (!user || !pending) return;
    setLoading(pending.id);
    setMessage("");
    setIsSuccess(false);
    const name = t(pending.nameKey);
    const expires = new Date();
    expires.setDate(expires.getDate() + pending.durationDays);
    const { error } = await supabase.from("signal_packages").insert({
      user_id: user.id,
      package_name: name,
      price: pending.price,
      status: "active",
      expires_at: expires.toISOString(),
    });
    if (error) {
      setMessage(
        formatTransactionError(
          error,
          error.message.includes("Insufficient") ? t("signals.insufficientBalance") : error.message,
          t("kyc.required")
        )
      );
      setIsSuccess(false);
    } else {
      setIsSuccess(true);
      setMessage(t("signals.subscribed", { name }));
      setPending(null);
      await load();
    }
    setLoading(null);
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        eyebrow={t("signals.eyebrow")}
        title={t("signals.title")}
        subtitle={t("signals.subtitle")}
        actions={
          <div className="rounded-full border border-border bg-card px-3.5 py-2 text-sm">
            <span className="text-muted">{t("signals.balance")}</span>
            <span className="ml-2 font-semibold text-emerald">{formatCurrency(balance)}</span>
          </div>
        }
      />

      <div className="grid gap-3 lg:grid-cols-2">
        <ProductNotice title={t("signals.howItWorksTitle")} body={t("signals.howItWorksBody")} />
        <ProductNotice variant="risk" title={t("signals.riskTitle")} body={t("signals.riskBody")} />
      </div>

      {hasActive && (
        <DashboardSheet>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-display text-base font-semibold text-foreground">{t("signals.accessTitle")}</p>
              <p className="mt-1 text-sm text-muted">{t("signals.accessBody")}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" className="rounded-full" asChild>
                <Link to="/dashboard/notifications">
                  <Bell className="h-3.5 w-3.5" />
                  {t("signals.openNotifications")}
                </Link>
              </Button>
              <Button size="sm" variant="outline" className="rounded-full" asChild>
                <Link to="/dashboard/trading-room">
                  <CandlestickChart className="h-3.5 w-3.5" />
                  {t("signals.openTradingRoom")}
                </Link>
              </Button>
            </div>
          </div>
        </DashboardSheet>
      )}

      <KycRequiredGate>
        <div className="grid gap-3 md:grid-cols-3">
          {SIGNAL_PACKAGES.map((pkg) => {
            const name = t(pkg.nameKey);
            return (
              <div key={pkg.id} className="flex flex-col rounded-2xl border border-border/70 bg-card p-4">
                <p className="font-display text-lg font-semibold text-foreground">{name}</p>
                <p className="mt-3 font-display text-2xl font-semibold tracking-tight">
                  {formatCurrency(pkg.price)}
                  <span className="ml-1 text-sm font-normal text-muted">
                    {t("signals.perPeriod", { days: pkg.durationDays })}
                  </span>
                </p>
                <p className="mt-2 text-sm text-muted">{t(pkg.volumeKey)}</p>
                <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                  {t("signals.includesTitle")}
                </p>
                <ul className="mt-2 space-y-1.5">
                  {pkg.includes.map((key) => (
                    <li key={key} className="flex items-start gap-2 text-xs text-muted">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald" />
                      <span>{t(key)}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  size="sm"
                  className="mt-4 w-full rounded-full"
                  disabled={loading === pkg.id}
                  onClick={() => requestSubscribe(pkg)}
                >
                  {loading === pkg.id ? t("common.saving") : t("signals.subscribe")}
                </Button>
                {balance < pkg.price && (
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
              title={t("signals.confirmTitle")}
              body={t("signals.confirmBody", {
                amount: formatCurrency(pending.price),
                name: t(pending.nameKey),
                days: pending.durationDays,
              })}
            />
            <div className="mt-4 flex flex-wrap gap-2">
              <Button className="rounded-full" disabled={!!loading} onClick={() => void confirmSubscribe()}>
                {loading ? t("common.saving") : t("signals.subscribe")}
              </Button>
              <Button
                variant="outline"
                className="rounded-full"
                disabled={!!loading}
                onClick={() => setPending(null)}
              >
                {t("signals.cancel")}
              </Button>
            </div>
          </DashboardSheet>
        )}

        {message && (
          <p className={cn("mt-3 text-sm", isSuccess ? "text-emerald" : "text-amber-400")}>{message}</p>
        )}
      </KycRequiredGate>

      <DashboardSheet>
        <h2 className="mb-4 font-display text-base font-semibold">{t("signals.activeSubs")}</h2>
        {subs.length === 0 ? (
          <p className="text-sm text-muted">{t("signals.noSubs")}</p>
        ) : (
          <div className="divide-y divide-border/50">
            {subs.map((s) => {
              const active = isSubActive(s);
              return (
                <div key={s.id} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">{s.package_name}</p>
                    <p className="text-xs text-muted">
                      {formatCurrency(s.price)} · {formatDate(s.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={active ? "success" : "secondary"}>
                      {active
                        ? t("signals.status.active")
                        : t("signals.status.expired")}
                    </Badge>
                    {s.expires_at && (
                      <p className="mt-1 text-xs text-muted">
                        {t("signals.expires")} {formatDate(s.expires_at)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DashboardSheet>
    </div>
  );
}
