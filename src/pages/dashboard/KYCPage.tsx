import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Camera,
  CheckCircle,
  Clock,
  FileCheck,
  Lock,
  Shield,
  TrendingUp,
  Upload,
  X,
} from "@/lib/icons";
import { DashboardSheet } from "@/components/dashboard/DashboardSheet";
import { FaceVerificationCapture } from "@/components/kyc/FaceVerificationCapture";
import { FadeIn } from "@/components/motion/Motion";
import { BRAND } from "@/constants/brand";
import { getKycStatus, type KycStatus } from "@/lib/kyc";
import { cn } from "@/lib/utils";

const DOC_TYPES = [
  { id: "passport", labelKey: "kyc.passport" },
  { id: "drivers_license", labelKey: "kyc.driversLicense" },
  { id: "national_id", labelKey: "kyc.nationalId" },
] as const;

const MAX_BYTES = 10 * 1024 * 1024;

function statusMeta(status: KycStatus) {
  if (status === "approved") {
    return {
      badgeClass: "border-emerald/30 bg-emerald/10 text-emerald",
      labelKey: "dashboard.verified" as const,
    };
  }
  if (status === "pending") {
    return {
      badgeClass: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
      labelKey: "dashboard.kycPending" as const,
    };
  }
  if (status === "rejected") {
    return {
      badgeClass: "border-red-500/30 bg-red-500/10 text-red-500",
      labelKey: "dashboard.kycRejected" as const,
    };
  }
  return {
    badgeClass: "border-border bg-secondary/60 text-muted",
    labelKey: "dashboard.kycNone" as const,
  };
}

export default function KYCPage() {
  const { t } = useTranslation();
  const { user, profile, refreshProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [docType, setDocType] = useState<(typeof DOC_TYPES)[number]["id"]>("passport");
  const [file, setFile] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const status = getKycStatus(profile);
  const meta = statusMeta(status);
  const canSubmit = status === "none" || status === "rejected";

  const trustPoints = useMemo(
    () => [
      { icon: Lock, title: t("kyc.trustEncryptedTitle"), desc: t("kyc.trustEncryptedDesc") },
      {
        icon: Shield,
        title: t("kyc.trustComplianceTitle"),
        desc: t("kyc.trustComplianceDesc", { brand: BRAND.name }),
      },
      { icon: Camera, title: t("kyc.trustFaceTitle"), desc: t("kyc.trustFaceDesc") },
      { icon: Clock, title: t("kyc.trustReviewTitle"), desc: t("kyc.trustReviewDesc") },
    ],
    [t]
  );

  const unlockPoints = useMemo(
    () => [
      { icon: ArrowDownToLine, label: t("kyc.unlockDeposits") },
      { icon: ArrowUpFromLine, label: t("kyc.unlockWithdrawals") },
      { icon: TrendingUp, label: t("kyc.unlockTrading") },
    ],
    [t]
  );

  const tips = useMemo(
    () => [t("kyc.tipClear"), t("kyc.tipCorners"), t("kyc.tipReadable"), t("kyc.tipMatch")],
    [t]
  );

  const steps = useMemo(
    () => [
      { n: 1, label: t("kyc.stepDocument") },
      { n: 2, label: t("kyc.stepFace") },
      { n: 3, label: t("kyc.stepReview") },
    ],
    [t]
  );

  const activeStep =
    status === "pending" || status === "approved"
      ? 3
      : selfie
        ? 3
        : file
          ? 2
          : 1;

  const pickFile = (next: File | null) => {
    setError("");
    setSuccess("");
    if (!next) {
      setFile(null);
      return;
    }
    const allowed = /^(image\/(jpeg|jpg|png|webp)|application\/pdf)$/i.test(next.type);
    if (!allowed) {
      setError(t("kyc.errorFileType"));
      setFile(null);
      return;
    }
    if (next.size > MAX_BYTES) {
      setError(t("kyc.errorFileSize"));
      setFile(null);
      return;
    }
    setFile(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !file) {
      setError(t("kyc.errorNoFile"));
      return;
    }
    if (!selfie) {
      setError(t("kyc.errorNoFace"));
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    const stamp = Date.now();
    const safeName = file.name.replace(/[^\w.\-]+/g, "_").slice(0, 80);
    const docPath = `${user.id}/${stamp}-${safeName}`;
    const selfiePath = `${user.id}/${stamp}-face-selfie.jpg`;

    const { error: uploadError } = await supabase.storage.from("kyc-documents").upload(docPath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

    if (uploadError) {
      setError(uploadError.message);
      setLoading(false);
      return;
    }

    const { error: selfieError } = await supabase.storage.from("kyc-documents").upload(selfiePath, selfie, {
      cacheControl: "3600",
      upsert: false,
      contentType: "image/jpeg",
    });

    if (selfieError) {
      setError(selfieError.message);
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("kyc_submissions").insert({
      user_id: user.id,
      document_type: docType,
      document_url: docPath,
      selfie_url: selfiePath,
      face_captured_at: new Date().toISOString(),
      status: "pending",
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    await supabase.from("profiles").update({ kyc_status: "pending" }).eq("id", user.id);
    await refreshProfile();
    setFile(null);
    setSelfie(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setSuccess(t("kyc.submitted"));
    setLoading(false);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={t("dashboard.navGroupAccount")}
        title={t("dashboard.kyc")}
        subtitle={t("kyc.subtitle")}
      />

      <FadeIn>
        <section
          className={cn(
            "relative overflow-hidden rounded-[1.75rem] border border-border p-5 sm:p-6",
            status === "approved"
              ? "bg-emerald/[0.07]"
              : status === "rejected"
                ? "bg-red-500/[0.05]"
                : "bg-card"
          )}
        >
          <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-emerald/10 blur-3xl" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-3">
              <div
                className={cn(
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
                  status === "approved"
                    ? "bg-emerald/15 text-emerald"
                    : status === "pending"
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                      : status === "rejected"
                        ? "bg-red-500/15 text-red-500"
                        : "bg-emerald/10 text-emerald"
                )}
              >
                {status === "approved" ? (
                  <CheckCircle className="h-6 w-6" />
                ) : status === "pending" ? (
                  <Clock className="h-6 w-6" />
                ) : (
                  <Shield className="h-6 w-6" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-lg font-semibold text-foreground">
                    {status === "approved"
                      ? t("kyc.statusApprovedTitle")
                      : status === "pending"
                        ? t("kyc.statusPendingTitle")
                        : status === "rejected"
                          ? t("kyc.statusRejectedTitle")
                          : t("kyc.statusNoneTitle")}
                  </h2>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
                      meta.badgeClass
                    )}
                  >
                    {t(meta.labelKey)}
                  </span>
                </div>
                <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted">
                  {status === "approved"
                    ? t("kyc.approvedDesc")
                    : status === "pending"
                      ? t("kyc.pendingDesc")
                      : status === "rejected"
                        ? t("kyc.rejectedDesc")
                        : t("kyc.introDesc")}
                </p>
              </div>
            </div>
          </div>

          {status !== "approved" && (
            <ol className="relative mt-5 grid gap-2 sm:grid-cols-3">
              {steps.map((step) => {
                const done = activeStep > step.n || status === "pending";
                const current = activeStep === step.n && status !== "pending";
                return (
                  <li
                    key={step.n}
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm",
                      done || current
                        ? "border-emerald/25 bg-emerald/[0.06] text-foreground"
                        : "border-border/70 bg-secondary/30 text-muted"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                        done || current ? "bg-emerald text-white" : "bg-secondary text-muted"
                      )}
                    >
                      {done && !current ? <CheckCircle className="h-3.5 w-3.5" /> : step.n}
                    </span>
                    <span className="font-medium">{step.label}</span>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      </FadeIn>

      {status === "approved" ? (
        <DashboardSheet>
          <div className="grid gap-3 sm:grid-cols-3">
            {unlockPoints.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-3 rounded-2xl border border-emerald/20 bg-emerald/[0.05] px-4 py-3"
              >
                <Icon className="h-5 w-5 shrink-0 text-emerald" />
                <p className="text-sm font-medium text-foreground">{label}</p>
              </div>
            ))}
          </div>
          <p className="mt-5 text-sm text-muted">{t("kyc.approvedSupport", { brand: BRAND.name })}</p>
        </DashboardSheet>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.9fr)]">
          <DashboardSheet>
            {status === "pending" ? (
              <div className="space-y-5">
                <div className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-4">
                  <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t("kyc.pendingCardTitle")}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{t("kyc.pendingCardDesc")}</p>
                  </div>
                </div>
                <ul className="space-y-2.5 text-sm text-muted">
                  <li className="flex gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald" />
                    {t("kyc.pendingPoint1")}
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald" />
                    {t("kyc.pendingPoint2")}
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald" />
                    {t("kyc.pendingPoint3")}
                  </li>
                </ul>
              </div>
            ) : canSubmit ? (
              <form onSubmit={handleSubmit} className="space-y-8">
                {status === "rejected" && (
                  <div className="rounded-2xl border border-red-500/25 bg-red-500/[0.06] px-4 py-3 text-sm text-red-500">
                    {t("kyc.rejectedBanner")}
                  </div>
                )}

                <div>
                  <Label className="text-sm font-semibold text-foreground">{t("kyc.documentType")}</Label>
                  <p className="mt-1 text-xs text-muted">{t("kyc.documentTypeHint")}</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    {DOC_TYPES.map((doc) => (
                      <button
                        key={doc.id}
                        type="button"
                        onClick={() => setDocType(doc.id)}
                        className={cn(
                          "rounded-2xl border px-3 py-3 text-left text-sm font-medium transition-colors",
                          docType === doc.id
                            ? "border-emerald/40 bg-emerald/[0.08] text-foreground ring-1 ring-emerald/20"
                            : "border-border bg-secondary/30 text-muted hover:border-border hover:text-foreground"
                        )}
                      >
                        <FileCheck
                          className={cn(
                            "mb-2 h-4 w-4",
                            docType === doc.id ? "text-emerald" : "text-muted"
                          )}
                        />
                        {t(doc.labelKey)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-semibold text-foreground">{t("kyc.uploadDocument")}</Label>
                  <p className="mt-1 text-xs text-muted">{t("kyc.uploadHint")}</p>

                  <input
                    ref={fileInputRef}
                    id="kyc-document"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf,.pdf,.jpg,.jpeg,.png,.webp"
                    className="sr-only"
                    onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
                  />

                  {!file ? (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-3 flex w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-secondary/20 px-4 py-10 text-center transition-colors hover:border-emerald/40 hover:bg-emerald/[0.04]"
                    >
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald/10 text-emerald">
                        <Upload className="h-5 w-5" />
                      </span>
                      <span className="text-sm font-semibold text-foreground">{t("kyc.uploadCta")}</span>
                      <span className="max-w-xs text-xs text-muted">{t("kyc.uploadFormats")}</span>
                    </button>
                  ) : (
                    <div className="mt-3 flex items-center gap-3 rounded-2xl border border-border bg-secondary/30 px-4 py-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald/10 text-emerald">
                        <FileCheck className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
                        <p className="text-xs text-muted">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          pickFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-secondary hover:text-foreground"
                        aria-label={t("kyc.removeFile")}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="border-t border-border pt-6">
                  <FaceVerificationCapture
                    value={selfie}
                    onChange={(next) => {
                      setError("");
                      setSelfie(next);
                    }}
                    disabled={loading}
                  />
                </div>

                {(error || success) && (
                  <p className={cn("text-sm", error ? "text-red-400" : "text-emerald")}>
                    {error || success}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={loading || !file || !selfie}
                  variant="pill"
                  className="w-full sm:w-auto"
                >
                  <Shield className="h-4 w-4" />
                  {loading ? t("common.saving") : t("kyc.submit")}
                </Button>
              </form>
            ) : null}
          </DashboardSheet>

          <div className="space-y-4">
            <DashboardSheet className="!py-5">
              <h3 className="font-display text-sm font-semibold text-foreground">{t("kyc.unlockTitle")}</h3>
              <ul className="mt-3 space-y-2.5">
                {unlockPoints.map(({ icon: Icon, label }) => (
                  <li key={label} className="flex items-center gap-3 text-sm text-muted">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald/10 text-emerald">
                      <Icon className="h-4 w-4" />
                    </span>
                    {label}
                  </li>
                ))}
              </ul>
            </DashboardSheet>

            <DashboardSheet className="!py-5">
              <h3 className="font-display text-sm font-semibold text-foreground">{t("kyc.trustTitle")}</h3>
              <ul className="mt-3 space-y-3">
                {trustPoints.map(({ icon: Icon, title, desc }) => (
                  <li key={title} className="flex gap-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-secondary text-foreground">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-foreground">{title}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted">{desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </DashboardSheet>

            {canSubmit && (
              <DashboardSheet className="!py-5">
                <h3 className="font-display text-sm font-semibold text-foreground">{t("kyc.tipsTitle")}</h3>
                <ul className="mt-3 space-y-2">
                  {tips.map((tip) => (
                    <li key={tip} className="flex gap-2 text-xs leading-relaxed text-muted">
                      <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </DashboardSheet>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
