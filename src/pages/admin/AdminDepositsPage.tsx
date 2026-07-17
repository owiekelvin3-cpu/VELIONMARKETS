import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, ImageIcon, RefreshCw } from "@/lib/icons";
import { supabase } from "@/lib/supabase";
import { approveDeposit, rejectDeposit } from "@/lib/admin-api";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { DepositDetailPanel } from "@/components/admin/DepositDetailPanel";
import { StatusBadge, isPending } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { LoadingScreen } from "@/components/ui/loading-screen";
import {
  formatDepositMethod,
  parseDepositNotes,
  type AdminDeposit,
} from "@/lib/deposit-details";
import { formatCurrency, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

type FilterKey = "all" | "pending" | "completed" | "rejected";

export default function AdminDepositsPage() {
  const { t } = useTranslation();
  const [deposits, setDeposits] = useState<AdminDeposit[]>([]);
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
      .from("deposits")
      .select("*, profiles(email, full_name)")
      .order("created_at", { ascending: false });
    if (err) setError(err.message);
    else setDeposits((data as AdminDeposit[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleApprove = async (d: AdminDeposit) => {
    setActing(d.id);
    setError("");
    setSuccess("");
    try {
      await approveDeposit(d.id, d.user_id, d.amount);
      setSuccess(t("admin.depositApproved", { amount: formatCurrency(d.amount) }));
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
      await rejectDeposit(id);
      setSuccess(t("admin.depositRejected"));
      await load();
      setExpandedId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("admin.actionFailed"));
    }
    setActing(null);
  };

  const filtered = deposits.filter((d) => {
    if (filter === "pending") return d.status === "pending";
    if (filter === "completed") return d.status === "completed" || d.status === "approved";
    if (filter === "rejected") return d.status === "rejected";
    return true;
  });

  const pendingCount = deposits.filter((d) => d.status === "pending").length;
  const completedCount = deposits.filter((d) => d.status === "completed" || d.status === "approved").length;
  const rejectedCount = deposits.filter((d) => d.status === "rejected").length;

  const FILTERS: { key: FilterKey; label: string; count?: number }[] = [
    { key: "all", label: t("admin.filterAll"), count: deposits.length },
    { key: "pending", label: t("admin.filterPending"), count: pendingCount },
    { key: "completed", label: t("admin.filterCompleted"), count: completedCount },
    { key: "rejected", label: t("admin.filterRejected"), count: rejectedCount },
  ];

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title={t("admin.depositsTitle")}
        subtitle={t("admin.depositsSubtitle")}
        action={
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            {t("admin.refresh")}
          </Button>
        }
      />

      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label={t("admin.totalDeposits")} value={deposits.length} />
        <StatCard label={t("admin.filterPending")} value={pendingCount} accent={pendingCount > 0} />
        <StatCard label={t("admin.filterCompleted")} value={completedCount} />
        <StatCard label={t("admin.totalVolume")} value={formatCurrency(deposits.reduce((s, d) => s + Number(d.amount), 0))} />
      </div>

      {error && (
        <p className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">{error}</p>
      )}
      {success && (
        <p className="rounded-xl border border-emerald/30 bg-emerald/10 px-4 py-3 text-sm text-emerald">{success}</p>
      )}

      <AdminPanel
        title={t("admin.allDeposits")}
        description={pendingCount > 0 ? t("admin.pendingDepositsCount", { count: pendingCount }) : undefined}
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
            <p className="text-sm text-muted">{t("admin.noDeposits")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((d) => {
              const meta = parseDepositNotes(d.notes, d.method);
              const hasImages = meta.type === "gift_card" && (meta.frontImageUrl || meta.backImageUrl);
              const isExpanded = expandedId === d.id;
              const pending = isPending(d.status);
              const userLabel = d.profiles?.full_name || d.profiles?.email || d.user_id.slice(0, 8);

              return (
                <div
                  key={d.id}
                  className={cn(
                    "rounded-xl border bg-card transition-colors",
                    pending ? "border-amber-500/20" : "border-border"
                  )}
                >
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="font-display text-base font-semibold text-foreground">
                          {formatCurrency(d.amount)}
                        </span>
                        <StatusBadge status={d.status} />
                        {hasImages && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted">
                            <ImageIcon className="h-3 w-3" />
                            {t("admin.hasImages")}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-sm text-muted">
                        <span className="font-medium text-foreground">{userLabel}</span>
                        {" · "}
                        {formatDepositMethod(d.method)}
                        {" · "}
                        {formatDate(d.created_at)}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setExpandedId(isExpanded ? null : d.id)}
                        aria-label={isExpanded ? t("admin.hideDetails") : t("admin.viewDetails")}
                      >
                        {isExpanded ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      {pending && !isExpanded && (
                        <>
                          <Button size="sm" disabled={acting === d.id} onClick={() => void handleApprove(d)}>
                            {t("admin.approve")}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={acting === d.id}
                            onClick={() => void handleReject(d.id)}
                          >
                            {t("admin.reject")}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-border p-4">
                      <DepositDetailPanel
                        deposit={d}
                        onClose={() => setExpandedId(null)}
                        actions={
                          pending ? (
                            <>
                              <Button size="sm" disabled={acting === d.id} onClick={() => void handleApprove(d)}>
                                {t("admin.approve")}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={acting === d.id}
                                onClick={() => void handleReject(d.id)}
                              >
                                {t("admin.reject")}
                              </Button>
                            </>
                          ) : undefined
                        }
                      />
                    </div>
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
    <div className="rounded-xl border border-border bg-card px-4 py-3">
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted">{label}</p>
      <p className={cn("mt-1 font-display text-lg font-semibold", accent ? "text-amber-400" : "text-foreground")}>
        {value}
      </p>
    </div>
  );
}
