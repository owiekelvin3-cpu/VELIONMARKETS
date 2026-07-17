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
import { MINING_PACKAGES, type MiningPackage } from "@/constants/products";
import {
  computeLiveMiningProfit,
  daysRemaining,
  fetchMiningContracts,
  getDailyYieldEstimate,
  getMiningProgress,
  syncMiningAccruals,
  type MiningContract,
} from "@/lib/mining";
import { ArrowDownToLine, Clock, Pickaxe, RefreshCw } from "@/lib/icons";

function MiningContractRow({ contract, tick }: { contract: MiningContract; tick: number }) {
  const { t } = useTranslation();
  const liveProfit = computeLiveMiningProfit(contract);
  const progress = getMiningProgress(contract);
  const daysLeft = daysRemaining(contract);
  const dailyEst = getDailyYieldEstimate(contract.investment, contract.daily_return);

  return (
    <div className="rounded-xl border border-border bg-secondary/30 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display font-semibold text-foreground">{contract.package_name}</p>
          <p className="mt-0.5 text-xs text-muted">
            {contract.hashrate ?? "—"} · {formatCurrency(contract.investment)} {t("mining.deployed")}
          </p>
        </div>
        <Badge variant={contract.status === "active" ? "success" : "secondary"}>
          {t(`mining.status.${contract.status}`, { defaultValue: contract.status })}
        </Badge>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg bg-card px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-wider text-muted">{t("mining.accruedProfit")}</p>
          <p className="mt-1 font-display text-lg font-semibold text-emerald" key={tick}>
            +{formatCurrency(liveProfit)}
          </p>
        </div>
        <div className="rounded-lg bg-card px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-wider text-muted">{t("mining.dailyYield")}</p>
          <p className="mt-1 font-semibold text-foreground">~{formatCurrency(dailyEst)}</p>
        </div>
        <div className="rounded-lg bg-card px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-wider text-muted">{t("mining.termRemaining")}</p>
          <p className="mt-1 font-semibold text-foreground">
            {contract.status === "active" ? t("mining.daysLeft", { count: daysLeft }) : "—"}
          </p>
        </div>
      </div>

      {contract.status === "active" && contract.expires_at && (
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs text-muted">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {t("mining.contractProgress")}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-emerald transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-1.5 text-[11px] text-muted">
            {t("mining.matures")} {formatDate(contract.expires_at)}
          </p>
        </div>
      )}
    </div>
  );
}

export default function MiningPage() {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const [contracts, setContracts] = useState<MiningContract[]>([]);
  const [balance, setBalance] = useState(0);
  const [pending, setPending] = useState<MiningPackage | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [tick, setTick] = useState(0);

  const load = useCallback(async (opts?: { sync?: boolean }) => {
    if (!user) return;
    await ensureValidSession();
    if (opts?.sync) {
      setSyncing(true);
      try {
        await syncMiningAccruals(user.id);
      } catch {
        /* non-fatal */
      }
      setSyncing(false);
    }
    const [contractList, balRes] = await Promise.all([
      fetchMiningContracts(user.id),
      supabase.from("balances").select("amount").eq("user_id", user.id).single(),
    ]);
    setContracts(contractList);
    setBalance(Number(balRes.data?.amount ?? 0));
  }, [user]);

  useEffect(() => {
    void load({ sync: true });
  }, [load]);

  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!user) return;
    const id = window.setInterval(() => void load({ sync: true }), 60_000);
    return () => window.clearInterval(id);
  }, [user, load]);

  const activeContracts = useMemo(
    () => contracts.filter((c) => c.status === "active"),
    [contracts]
  );
  const historyContracts = useMemo(
    () => contracts.filter((c) => c.status !== "active"),
    [contracts]
  );

  const deployed = useMemo(
    () => activeContracts.reduce((s, c) => s + c.investment, 0),
    [activeContracts]
  );
  const totalAccrued = useMemo(
    () => activeContracts.reduce((s, c) => s + computeLiveMiningProfit(c), 0),
    [activeContracts, tick]
  );
  const estDaily = useMemo(
    () => activeContracts.reduce((s, c) => s + getDailyYieldEstimate(c.investment, c.daily_return), 0),
    [activeContracts]
  );

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
      package_id: pending.id,
      package_name: name,
      investment: pending.investment,
      daily_return: pending.dailyReturnEstimate,
      hashrate: pending.hashrate,
      term_days: pending.termDays,
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
      await load({ sync: true });
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
          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-full border border-border bg-card px-3.5 py-2 text-sm">
              <span className="text-muted">{t("mining.balance")}</span>
              <span className="ml-2 font-semibold text-emerald">{formatCurrency(balance)}</span>
            </div>
            <Button variant="outline" size="sm" className="rounded-full" disabled={syncing} onClick={() => void load({ sync: true })}>
              <RefreshCw className={cn("h-3.5 w-3.5", syncing && "animate-spin")} />
              {t("mining.sync")}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: t("mining.deployedCapital"), value: formatCurrency(deployed) },
          { label: t("mining.activeContracts"), value: String(activeContracts.length) },
          { label: t("mining.totalAccrued"), value: `+${formatCurrency(totalAccrued)}`, accent: true },
          { label: t("mining.estDailyYield"), value: `~${formatCurrency(estDaily)}` },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-card px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted">{stat.label}</p>
            <p className={cn("mt-1 font-display text-lg font-semibold", stat.accent ? "text-emerald" : "text-foreground")}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {activeContracts.length > 0 && (
        <DashboardSheet>
          <div className="mb-4 flex items-center gap-2">
            <Pickaxe className="h-4 w-4 text-emerald" />
            <h2 className="font-display text-base font-semibold">{t("mining.activeContractsTitle")}</h2>
          </div>
          <div className="space-y-3">
            {activeContracts.map((c) => (
              <MiningContractRow key={c.id} contract={c} tick={tick} />
            ))}
          </div>
        </DashboardSheet>
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        <ProductNotice title={t("mining.howItWorksTitle")} body={t("mining.howItWorksBody")} />
        <ProductNotice variant="risk" title={t("mining.riskTitle")} body={t("mining.riskBody")} />
      </div>

      <KycRequiredGate>
        <div>
          <h2 className="mb-3 font-display text-base font-semibold">{t("mining.catalogTitle")}</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {MINING_PACKAGES.map((pkg) => {
              const name = t(pkg.nameKey);
              const canAfford = balance >= pkg.investment;
              const dailyEst = getDailyYieldEstimate(pkg.investment, pkg.dailyReturnEstimate);
              return (
                <div key={pkg.id} className="flex flex-col rounded-2xl border border-border bg-card p-4">
                  <p className="font-display text-lg font-semibold text-foreground">{name}</p>
                  <p className="mt-3 font-display text-2xl font-semibold tracking-tight">
                    {formatCurrency(pkg.investment)}
                  </p>
                  <dl className="mt-4 flex-1 space-y-2 text-xs text-muted">
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
                      <dd className="font-medium text-foreground">~{pkg.dailyReturnEstimate}% {t("mining.daily")}</dd>
                    </div>
                    <div className="flex justify-between gap-3 border-t border-border/60 pt-2">
                      <dt>{t("mining.dailyYield")}</dt>
                      <dd className="font-semibold text-emerald">~{formatCurrency(dailyEst)}</dd>
                    </div>
                  </dl>
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
        </div>

        {pending && (
          <DashboardSheet className="mt-4">
            <ProductNotice
              variant="risk"
              title={t("mining.confirmTitle")}
              body={t("mining.confirmBody", {
                amount: formatCurrency(pending.investment),
                name: t(pending.nameKey),
                days: pending.termDays,
              })}
            />
            <div className="mt-4 flex flex-wrap gap-2">
              <Button className="rounded-full" disabled={!!loading} onClick={() => void confirmPurchase()}>
                {loading ? t("common.saving") : t("mining.purchase")}
              </Button>
              <Button variant="outline" className="rounded-full" disabled={!!loading} onClick={() => setPending(null)}>
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
        <h2 className="mb-4 font-display text-base font-semibold">{t("mining.contractHistory")}</h2>
        {historyContracts.length === 0 && activeContracts.length === 0 ? (
          <p className="text-sm text-muted">{t("mining.noPackages")}</p>
        ) : historyContracts.length === 0 ? (
          <p className="text-sm text-muted">{t("mining.noHistory")}</p>
        ) : (
          <div className="divide-y divide-border/50">
            {historyContracts.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">
                    {s.package_name} — {formatCurrency(s.investment)}
                  </p>
                  <p className="text-xs text-muted">
                    {formatDate(s.created_at)} · +{formatCurrency(s.accrued_profit)} {t("mining.settled")}
                  </p>
                </div>
                <Badge variant="secondary">{t(`mining.status.${s.status}`, { defaultValue: s.status })}</Badge>
              </div>
            ))}
          </div>
        )}
      </DashboardSheet>
    </div>
  );
}
