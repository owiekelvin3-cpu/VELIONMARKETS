import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, RefreshCw } from "@/lib/icons";
import { supabase } from "@/lib/supabase";
import { completeWithdrawal, rejectWithdrawal } from "@/lib/admin-api";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPanel } from "@/components/admin/AdminPanel";
import {
  WithdrawalDetailPanel,
  type AdminWithdrawal,
} from "@/components/admin/WithdrawalDetailPanel";
import { StatusBadge, isPending } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

type FilterKey = "all" | "pending" | "completed" | "rejected";

export default function AdminWithdrawalsPage() {
  const { t } = useTranslation();
  const [withdrawals, setWithdrawals] = useState<AdminWithdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [acting, setActing] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const { data, error: err } = await supabase
      .from("withdrawals")
      .select("*, profiles(email, full_name)")
      .order("created_at", { ascending: false });
    if (err) setError(err.message);
    else setWithdrawals((data as AdminWithdrawal[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleComplete = async (w: AdminWithdrawal) => {
    setActing(w.id);
    setError("");
    setSuccess("");
    try {
      await completeWithdrawal(w.id, w.user_id, w.amount);
      setSuccess(t("admin.withdrawalProcessed", { amount: formatCurrency(w.amount) }));
      await load();
      setExpandedId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("admin.actionFailed"));
    }
    setActing(null);
  };

  const handleReject = async (id: string) => {
    setActing(id);
    setError("");
    setSuccess("");
    try {
      await rejectWithdrawal(id);
      setSuccess(t("admin.withdrawalRejected"));
      await load();
      setExpandedId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("admin.actionFailed"));
    }
    setActing(null);
  };

  const filtered = withdrawals.filter((w) => {
    if (filter === "pending") return w.status === "pending";
    if (filter === "completed") return w.status === "completed" || w.status === "approved";
    if (filter === "rejected") return w.status === "rejected";
    return true;
  });

  const pendingCount = withdrawals.filter((w) => w.status === "pending").length;
  const completedCount = withdrawals.filter(
    (w) => w.status === "completed" || w.status === "approved"
  ).length;
  const rejectedCount = withdrawals.filter((w) => w.status === "rejected").length;
  const totalVolume = withdrawals.reduce((s, w) => s + Number(w.amount), 0);

  const FILTERS: { key: FilterKey; label: string; count?: number }[] = [
    { key: "all", label: t("admin.filterAll"), count: withdrawals.length },
    { key: "pending", label: t("admin.filterPending"), count: pendingCount },
    { key: "completed", label: t("admin.filterCompleted"), count: completedCount },
    { key: "rejected", label: t("admin.filterRejected"), count: rejectedCount },
  ];

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title={t("admin.withdrawalsTitle")}
        subtitle={t("admin.withdrawalsSubtitle")}
        action={
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            {t("admin.refresh")}
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label={t("admin.totalWithdrawals")} value={withdrawals.length} />
        <StatCard label={t("admin.filterPending")} value={pendingCount} accent={pendingCount > 0} />
        <StatCard label={t("admin.filterCompleted")} value={completedCount} />
        <StatCard label={t("admin.totalVolume")} value={formatCurrency(totalVolume)} />
      </div>

      {error && (
        <p className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-xl border border-emerald/30 bg-emerald/10 px-4 py-3 text-sm text-emerald">
          {success}
        </p>
      )}

      <AdminPanel
        title={t("admin.allWithdrawals")}
        description={
          pendingCount > 0 ? t("admin.pendingWithdrawalsCount", { count: pendingCount }) : undefined
        }
        action={
          <div className="flex gap-1 overflow-x-auto rounded-lg border border-border bg-secondary/40 p-0.5 scrollbar-none">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={cn(
                  "shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  filter === f.key
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted hover:text-foreground"
                )}
              >
                {f.label}
                {f.count !== undefined && f.count > 0 && (
                  <span className="ml-1.5 text-[10px] opacity-60">{f.count}</span>
                )}
              </button>
            ))}
          </div>
        }
      >
        {loading ? (
          <LoadingScreen />
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-12 text-center">
            <p className="text-sm text-muted">{t("admin.noWithdrawals")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((w) => {
              const pending = isPending(w.status);
              const isExpanded = expandedId === w.id;
              const userLabel =
                w.profiles?.full_name || w.profiles?.email || w.user_id.slice(0, 8);

              return (
                <div
                  key={w.id}
                  className={cn(
                    "rounded-xl border bg-card transition-colors",
                    pending ? "border-amber-500/20" : "border-border"
                  )}
                >
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="font-display text-base font-semibold text-foreground">
                          {formatCurrency(w.amount)}
                        </span>
                        <StatusBadge status={w.status} />
                      </div>
                      <p className="mt-0.5 text-sm text-muted">
                        <span className="font-medium text-foreground">{userLabel}</span>
                        {w.profiles?.email && w.profiles.full_name ? (
                          <span className="text-muted"> · {w.profiles.email}</span>
                        ) : null}
                        {" · "}
                        {w.method}
                        {" · "}
                        {formatDate(w.created_at)}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setExpandedId(isExpanded ? null : w.id)}
                        aria-label={isExpanded ? t("admin.hideDetails") : t("admin.viewDetails")}
                      >
                        {isExpanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      {pending && (
                        <>
                          <Button
                            size="sm"
                            disabled={acting === w.id}
                            onClick={() => void handleComplete(w)}
                          >
                            {t("admin.process")}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={acting === w.id}
                            onClick={() => void handleReject(w.id)}
                          >
                            {t("admin.reject")}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <WithdrawalDetailPanel
                      withdrawal={w}
                      onFeeAssigned={() => setSuccess(t("admin.userDetail.feeAssigned"))}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </AdminPanel>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card px-4 py-3",
        accent && "border-amber-500/25 bg-amber-500/5"
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="mt-1 font-display text-xl font-semibold text-foreground">{value}</p>
    </div>
  );
}
