import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Eye, ImageIcon } from "@/lib/icons";
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

export default function AdminDepositsPage() {
  const { t } = useTranslation();
  const [deposits, setDeposits] = useState<AdminDeposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [acting, setActing] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");

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

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (d: AdminDeposit) => {
    setActing(d.id);
    setError("");
    try {
      await approveDeposit(d.id, d.user_id, d.amount);
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
    try {
      await rejectDeposit(id);
      await load();
      setExpandedId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("admin.actionFailed"));
    }
    setActing(null);
  };

  const filtered = deposits.filter((d) => {
    if (filter === "pending") return d.status === "pending";
    if (filter === "completed") return d.status === "completed";
    return true;
  });

  const pendingCount = deposits.filter((d) => d.status === "pending").length;

  return (
    <div className="space-y-6">
      <AdminPageHeader title={t("admin.depositsTitle")} subtitle={t("admin.depositsSubtitle")} />

      {error && <p className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">{error}</p>}

      <AdminPanel
        title={t("admin.allDeposits")}
        description={pendingCount > 0 ? t("admin.pendingDepositsCount", { count: pendingCount }) : undefined}
        action={
          <div className="flex gap-1 rounded-lg border border-border bg-secondary/50 p-1">
            {(["all", "pending", "completed"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                  filter === f ? "bg-emerald/10 text-emerald" : "text-muted hover:text-foreground"
                )}
              >
                {t(`admin.filter${f.charAt(0).toUpperCase()}${f.slice(1)}`)}
              </button>
            ))}
          </div>
        }
      >
        {loading ? (
          <LoadingScreen />
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted">{t("admin.noDeposits")}</p>
        ) : (
          <div className="space-y-3">
            {filtered.map((d) => {
              const meta = parseDepositNotes(d.notes, d.method);
              const hasImages = meta.type === "gift_card" && (meta.frontImageUrl || meta.backImageUrl);
              const isExpanded = expandedId === d.id;

              return (
                <div key={d.id} className="rounded-xl border border-border bg-secondary/50">
                  <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-foreground">{formatCurrency(d.amount)}</p>
                        {hasImages && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gold/10 px-2 py-0.5 text-[10px] font-medium text-gold">
                            <ImageIcon className="h-3 w-3" />
                            {t("admin.hasImages")}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted">
                        {formatDepositMethod(d.method)} · {d.profiles?.email || d.user_id}
                      </p>
                      <p className="text-xs text-muted">{formatDate(d.created_at)}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={d.status} />
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-border"
                        onClick={() => setExpandedId(isExpanded ? null : d.id)}
                      >
                        <Eye className="mr-1.5 h-3.5 w-3.5" />
                        {isExpanded ? t("admin.hideDetails") : t("admin.viewDetails")}
                      </Button>
                      {isPending(d.status) && !isExpanded && (
                        <>
                          <Button size="sm" disabled={acting === d.id} onClick={() => handleApprove(d)}>
                            {t("admin.approve")}
                          </Button>
                          <Button size="sm" variant="destructive" disabled={acting === d.id} onClick={() => handleReject(d.id)}>
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
                          isPending(d.status) ? (
                            <>
                              <Button size="sm" disabled={acting === d.id} onClick={() => handleApprove(d)}>
                                {t("admin.approve")}
                              </Button>
                              <Button size="sm" variant="destructive" disabled={acting === d.id} onClick={() => handleReject(d.id)}>
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
