import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabase";
import { createKycDocumentSignedUrl } from "@/lib/kyc";
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
  selfie_url: string | null;
  face_captured_at: string | null;
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
  const [openingKey, setOpeningKey] = useState<string | null>(null);

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

  useEffect(() => {
    void load();
  }, [load]);

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

  const openAsset = async (id: string, path: string | null, kind: "doc" | "face") => {
    if (!path) return;
    const key = `${id}-${kind}`;
    setOpeningKey(key);
    setError("");
    try {
      const url = await createKycDocumentSignedUrl(path, 180);
      if (!url) {
        setError(t("admin.viewDocument") + " unavailable");
        return;
      }
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not open document");
    } finally {
      setOpeningKey(null);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader title={t("admin.kycTitle")} subtitle={t("admin.kycSubtitle")} />

      {error && (
        <p className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">{error}</p>
      )}

      <AdminPanel title={t("admin.pendingSubmissions")}>
        {loading ? (
          <LoadingScreen />
        ) : submissions.length === 0 ? (
          <p className="text-sm text-muted">{t("admin.noKyc")}</p>
        ) : (
          <div className="space-y-3">
            {submissions.map((s) => (
              <div
                key={s.id}
                className="flex flex-col gap-3 rounded-xl border border-border bg-secondary/50 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">
                    {s.profiles?.full_name || s.profiles?.email}
                  </p>
                  <p className="truncate text-sm text-muted">
                    {s.document_type} · {formatDate(s.created_at)}
                    {s.face_captured_at ? ` · ${t("admin.faceVerified")}` : ""}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-3">
                    {s.document_url && (
                      <button
                        type="button"
                        onClick={() => void openAsset(s.id, s.document_url, "doc")}
                        disabled={openingKey === `${s.id}-doc`}
                        className="text-sm font-medium text-emerald hover:underline disabled:opacity-60"
                      >
                        {openingKey === `${s.id}-doc` ? t("common.loading") : t("admin.viewDocument")}
                      </button>
                    )}
                    {s.selfie_url && (
                      <button
                        type="button"
                        onClick={() => void openAsset(s.id, s.selfie_url, "face")}
                        disabled={openingKey === `${s.id}-face`}
                        className="text-sm font-medium text-emerald hover:underline disabled:opacity-60"
                      >
                        {openingKey === `${s.id}-face` ? t("common.loading") : t("admin.viewSelfie")}
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={s.status} />
                  {s.status === "pending" && (
                    <>
                      <Button size="sm" disabled={acting === s.id} onClick={() => void updateStatus(s.id, s.user_id, "approved")}>
                        {t("admin.approve")}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={acting === s.id}
                        onClick={() => void updateStatus(s.id, s.user_id, "rejected")}
                      >
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
