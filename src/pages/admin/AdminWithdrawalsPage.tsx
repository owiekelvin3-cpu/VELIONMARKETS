import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabase";
import { completeWithdrawal, rejectWithdrawal } from "@/lib/admin-api";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { StatusBadge, isPending } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Withdrawal } from "@/types/database";

export default function AdminWithdrawalsPage() {
  const { t } = useTranslation();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const { data, error: err } = await supabase.from("withdrawals").select("*").order("created_at", { ascending: false });
    if (err) setError(err.message);
    else setWithdrawals(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleComplete = async (w: Withdrawal) => {
    setActing(w.id);
    setError("");
    try {
      await completeWithdrawal(w.id, w.user_id, w.amount);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("admin.actionFailed"));
    }
    setActing(null);
  };

  const handleReject = async (id: string) => {
    setActing(id);
    setError("");
    try {
      await rejectWithdrawal(id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("admin.actionFailed"));
    }
    setActing(null);
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader title={t("admin.withdrawalsTitle")} subtitle={t("admin.withdrawalsSubtitle")} />

      {error && <p className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">{error}</p>}

      <AdminPanel title={t("admin.allWithdrawals")}>
        {loading ? (
          <LoadingScreen />
        ) : withdrawals.length === 0 ? (
          <p className="text-sm text-muted">{t("admin.noWithdrawals")}</p>
        ) : (
          <div className="space-y-3">
            {withdrawals.map((w) => (
              <div key={w.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.04] bg-white/[0.02] p-4">
                <div>
                  <p className="font-medium text-foreground">{formatCurrency(w.amount)}</p>
                  <p className="text-sm text-muted">{w.method} · {formatDate(w.created_at)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={w.status} />
                  {isPending(w.status) && (
                    <>
                      <Button size="sm" disabled={acting === w.id} onClick={() => handleComplete(w)}>
                        {t("admin.process")}
                      </Button>
                      <Button size="sm" variant="destructive" disabled={acting === w.id} onClick={() => handleReject(w.id)}>
                        {t("admin.reject")}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminPanel>
    </div>
  );
}
