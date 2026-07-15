import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Camera,
  CheckCircle,
  ChevronDown,
  Clock,
  ExternalLink,
  FileCheck,
  ImageIcon,
  X,
} from "@/lib/icons";
import { supabase } from "@/lib/supabase";
import { createKycDocumentSignedUrl } from "@/lib/kyc";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { formatDate, cn } from "@/lib/utils";

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

type Filter = "all" | "pending" | "approved" | "rejected";

function docTypeLabel(type: string, t: (key: string) => string) {
  const key = `admin.kycDocType.${type}`;
  const labeled = t(key);
  return labeled === key ? type.replace(/_/g, " ") : labeled;
}

function isImagePath(path: string | null) {
  if (!path) return false;
  return /\.(jpe?g|png|webp|gif)(\?|$)/i.test(path) || !/\.pdf(\?|$)/i.test(path);
}

function KycPreview({
  label,
  path,
  emptyLabel,
  openLabel,
  loadingLabel,
  onOpen,
  opening,
}: {
  label: string;
  path: string | null;
  emptyLabel: string;
  openLabel: string;
  loadingLabel: string;
  onOpen: () => void;
  opening: boolean;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setUrl(null);
    setFailed(false);
    if (!path || !isImagePath(path)) return;

    void createKycDocumentSignedUrl(path, 300).then((signed) => {
      if (!cancelled) setUrl(signed);
    });

    return () => {
      cancelled = true;
    };
  }, [path]);

  if (!path) {
    return (
      <div className="flex min-h-[180px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-secondary/30 px-4 text-center">
        <ImageIcon className="h-6 w-6 text-muted" />
        <p className="text-xs text-muted">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-secondary/20">
      <div className="flex items-center justify-between gap-2 border-b border-border/70 px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">{label}</p>
        <button
          type="button"
          onClick={onOpen}
          disabled={opening}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald hover:underline disabled:opacity-60"
        >
          <ExternalLink className="h-3 w-3" />
          {opening ? loadingLabel : openLabel}
        </button>
      </div>
      <div className="relative aspect-[4/3] bg-[#0b0c0e]">
        {url && !failed ? (
          <img
            src={url}
            alt=""
            className="h-full w-full object-contain"
            onError={() => setFailed(true)}
          />
        ) : (
          <button
            type="button"
            onClick={onOpen}
            className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted transition-colors hover:bg-white/[0.03] hover:text-foreground"
          >
            <FileCheck className="h-7 w-7 text-emerald" />
            <span className="text-xs font-medium">{opening ? loadingLabel : openLabel}</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default function AdminKYCPage() {
  const { t } = useTranslation();
  const [submissions, setSubmissions] = useState<KYCSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [acting, setActing] = useState<string | null>(null);
  const [openingKey, setOpeningKey] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("pending");
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  const pendingCount = useMemo(
    () => submissions.filter((s) => s.status === "pending").length,
    [submissions]
  );

  const filtered = useMemo(
    () =>
      submissions.filter((s) => {
        if (filter === "all") return true;
        return s.status === filter;
      }),
    [submissions, filter]
  );

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
    else {
      await load();
      setExpandedId(null);
    }
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
        setError(`${t("admin.viewDocument")} unavailable`);
        return;
      }
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not open document");
    } finally {
      setOpeningKey(null);
    }
  };

  const filters: { id: Filter; label: string }[] = [
    { id: "pending", label: t("admin.filterPending") },
    { id: "all", label: t("admin.filterAll") },
    { id: "approved", label: t("admin.filterApproved") },
    { id: "rejected", label: t("admin.filterRejected") },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader title={t("admin.kycTitle")} subtitle={t("admin.kycSubtitle")} />

      {error && (
        <p className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
          {error}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card px-4 py-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
            {t("admin.filterPending")}
          </p>
          <p className="mt-1 font-display text-2xl font-semibold text-amber-500">{pendingCount}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card px-4 py-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
            {t("admin.filterApproved")}
          </p>
          <p className="mt-1 font-display text-2xl font-semibold text-emerald">
            {submissions.filter((s) => s.status === "approved").length}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card px-4 py-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
            {t("admin.filterRejected")}
          </p>
          <p className="mt-1 font-display text-2xl font-semibold text-red-400">
            {submissions.filter((s) => s.status === "rejected").length}
          </p>
        </div>
      </div>

      <AdminPanel
        title={t("admin.pendingSubmissions")}
        description={
          pendingCount > 0 ? t("admin.pendingKycCount", { count: pendingCount }) : undefined
        }
        action={
          <div className="flex max-w-full gap-1 overflow-x-auto rounded-lg border border-border bg-secondary/50 p-1 scrollbar-none">
            {filters.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={cn(
                  "min-h-9 shrink-0 rounded-md px-3 py-2 text-xs font-medium transition-colors",
                  filter === f.id ? "bg-emerald/10 text-emerald" : "text-muted hover:text-foreground"
                )}
              >
                {f.label}
                {f.id === "pending" && pendingCount > 0 ? ` (${pendingCount})` : ""}
              </button>
            ))}
          </div>
        }
      >
        {loading ? (
          <LoadingScreen />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-muted">
              <FileCheck className="h-5 w-5" />
            </span>
            <p className="text-sm text-muted">
              {submissions.length === 0 ? t("admin.noKyc") : t("admin.noKycFiltered")}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((s) => {
              const expanded = expandedId === s.id;
              const name = s.profiles?.full_name || s.profiles?.email || s.user_id;
              const email = s.profiles?.email;

              return (
                <div
                  key={s.id}
                  className={cn(
                    "overflow-hidden rounded-2xl border transition-colors",
                    s.status === "pending"
                      ? "border-amber-500/25 bg-amber-500/[0.03]"
                      : "border-border bg-secondary/40"
                  )}
                >
                  <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-medium text-foreground">{name}</p>
                        <StatusBadge status={s.status} />
                      </div>
                      {email && name !== email && (
                        <p className="mt-0.5 truncate text-xs text-muted">{email}</p>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                        <span className="inline-flex items-center gap-1.5">
                          <FileCheck className="h-3.5 w-3.5 text-emerald" />
                          {docTypeLabel(s.document_type, t)}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          {formatDate(s.created_at)}
                        </span>
                        {s.selfie_url && (
                          <span className="inline-flex items-center gap-1.5 text-emerald">
                            <Camera className="h-3.5 w-3.5" />
                            {t("admin.faceVerified")}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setExpandedId(expanded ? null : s.id)}
                      >
                        <ChevronDown
                          className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-180")}
                        />
                        {expanded ? t("admin.hideDetails") : t("admin.viewDetails")}
                      </Button>
                      {s.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            disabled={acting === s.id}
                            onClick={() => void updateStatus(s.id, s.user_id, "approved")}
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            {t("admin.approve")}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={acting === s.id}
                            onClick={() => void updateStatus(s.id, s.user_id, "rejected")}
                          >
                            <X className="h-3.5 w-3.5" />
                            {t("admin.reject")}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {expanded && (
                    <div className="border-t border-border/70 bg-background/40 px-4 py-4">
                      <p className="mb-3 text-xs leading-relaxed text-muted">
                        {t("admin.kycCompareHint")}
                      </p>
                      <div className="grid gap-3 lg:grid-cols-2">
                        <KycPreview
                          label={t("admin.kycDocLabel")}
                          path={s.document_url}
                          emptyLabel={t("admin.kycNoDoc")}
                          openLabel={t("admin.kycOpenFull")}
                          loadingLabel={t("common.loading")}
                          opening={openingKey === `${s.id}-doc`}
                          onOpen={() => void openAsset(s.id, s.document_url, "doc")}
                        />
                        <KycPreview
                          label={t("admin.kycSelfieLabel")}
                          path={s.selfie_url}
                          emptyLabel={t("admin.kycNoSelfie")}
                          openLabel={t("admin.kycOpenFull")}
                          loadingLabel={t("common.loading")}
                          opening={openingKey === `${s.id}-face`}
                          onOpen={() => void openAsset(s.id, s.selfie_url, "face")}
                        />
                      </div>

                      <div className="mt-4 grid gap-2 rounded-2xl border border-border/70 bg-secondary/25 p-3 text-xs text-muted sm:grid-cols-3">
                        <div>
                          <p className="font-semibold uppercase tracking-[0.12em] text-muted/80">
                            {t("admin.kycSubmittedAt")}
                          </p>
                          <p className="mt-1 text-foreground">{formatDate(s.created_at)}</p>
                        </div>
                        <div>
                          <p className="font-semibold uppercase tracking-[0.12em] text-muted/80">
                            {t("admin.method")}
                          </p>
                          <p className="mt-1 capitalize text-foreground">
                            {docTypeLabel(s.document_type, t)}
                          </p>
                        </div>
                        <div>
                          <p className="font-semibold uppercase tracking-[0.12em] text-muted/80">
                            {t("admin.kycFaceAt")}
                          </p>
                          <p className="mt-1 text-foreground">
                            {s.face_captured_at ? formatDate(s.face_captured_at) : "—"}
                          </p>
                        </div>
                      </div>

                      {s.status === "pending" && (
                        <div className="mt-4 flex flex-wrap justify-end gap-2">
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={acting === s.id}
                            onClick={() => void updateStatus(s.id, s.user_id, "rejected")}
                          >
                            {t("admin.reject")}
                          </Button>
                          <Button
                            size="sm"
                            disabled={acting === s.id}
                            onClick={() => void updateStatus(s.id, s.user_id, "approved")}
                          >
                            {t("admin.approve")}
                          </Button>
                        </div>
                      )}
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
