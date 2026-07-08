import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabase";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { formatDate } from "@/lib/utils";

interface KYCSubmission {
  id: string;
  user_id: string;
  document_type: string;
  document_url: string | null;
  status: string;
  created_at: string;
  profiles?: { email: string; full_name: string | null };
}

export default function AdminKYCPage() {
  const { t } = useTranslation();
  const [submissions, setSubmissions] = useState<KYCSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const { data, error: err } = await supabase
      .from("kyc_submissions")
      .select("*, profiles(email, full_name)")
      .order("created_at", { ascending: false });
    if (err) setError(err.message);
    else setSubmissions((data as KYCSubmission[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, userId: string, status: "approved" | "rejected") => {
    setActing(id);
    setError("");
    const { error: kycErr } = await supabase.from("kyc_submissions").update({ status }).eq("id", id);
    if (kycErr) {
      setError(kycErr.message);
      setActing(null);
      return;
    }
    const { error: profErr } = await supabase.from("profiles").update({ kyc_status: status }).eq("id", userId);
    if (profErr) setError(profErr.message);
    else await load();
    setActing(null);
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader title={t("admin.kycTitle")} subtitle={t("admin.kycSubtitle")} />

      {error && <p className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">{error}</p>}

      <AdminPanel title={t("admin.pendingSubmissions")}>
        {loading ? (
          <LoadingScreen />
        ) : submissions.length === 0 ? (
          <p className="text-sm text-muted">{t("admin.noKyc")}</p>
        ) : (
          <div className="space-y-3">
            {submissions.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.04] bg-white/[0.02] p-4">
                <div>
                  <p className="font-medium text-foreground">{s.profiles?.full_name || s.profiles?.email}</p>
                  <p className="text-sm text-muted">{s.document_type} · {formatDate(s.created_at)}</p>
                  {s.document_url && (
                    <a href={s.document_url} target="_blank" rel="noopener noreferrer" className="text-sm text-emerald hover:underline">
                      {t("admin.viewDocument")}
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={s.status} />
                  {s.status === "pending" && (
                    <>
                      <Button size="sm" disabled={acting === s.id} onClick={() => updateStatus(s.id, s.user_id, "approved")}>
                        {t("admin.approve")}
                      </Button>
                      <Button size="sm" variant="destructive" disabled={acting === s.id} onClick={() => updateStatus(s.id, s.user_id, "rejected")}>
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
