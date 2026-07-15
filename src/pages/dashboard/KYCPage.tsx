import { useState } from "react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FileCheck, Upload } from "@/lib/icons";
import { DashboardSheet } from "@/components/dashboard/DashboardSheet";

export default function KYCPage() {
  const { t } = useTranslation();
  const { user, profile, refreshProfile } = useAuth();
  const [docType, setDocType] = useState("passport");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const statusColors: Record<string, "default" | "success" | "warning" | "destructive"> = {
    none: "secondary" as "default",
    pending: "warning",
    approved: "success",
    rejected: "destructive",
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const file = form.get("document") as File;

    let documentUrl = null;
    if (file && file.size > 0) {
      const path = `${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("kyc-documents").upload(path, file);
      if (uploadError) {
        setMessage(uploadError.message);
        setLoading(false);
        return;
      }
      const { data: urlData } = supabase.storage.from("kyc-documents").getPublicUrl(path);
      documentUrl = urlData.publicUrl;
    }

    const { error } = await supabase.from("kyc_submissions").insert({
      user_id: user.id,
      document_type: docType,
      document_url: documentUrl,
      status: "pending",
    });

    if (!error) {
      await supabase.from("profiles").update({ kyc_status: "pending" }).eq("id", user.id);
      await refreshProfile();
      setMessage(t("kyc.submitted", { defaultValue: "KYC documents submitted for review." }));
    } else {
      setMessage(error.message);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("dashboard.kyc")}
        subtitle={t("kyc.subtitle", { defaultValue: "Verify your identity to unlock full platform access." })}
      />
      <DashboardSheet>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-display text-base font-semibold">
            <FileCheck className="h-5 w-5 text-emerald" />
            {t("kyc.identityTitle", { defaultValue: "Identity Verification" })}
          </h2>
          <Badge variant={statusColors[profile?.kyc_status || "none"]}>
            {profile?.kyc_status === "none"
              ? t("dashboard.kycNone")
              : t(
                  profile?.kyc_status === "pending"
                    ? "dashboard.kycPending"
                    : profile?.kyc_status === "approved"
                      ? "dashboard.verified"
                      : "dashboard.kycRejected"
                )}
          </Badge>
        </div>
        {profile?.kyc_status === "approved" ? (
          <p className="text-muted">
            {t("kyc.approvedDesc", {
              defaultValue: "Your identity has been verified. You have full access to all platform features.",
            })}
          </p>
        ) : profile?.kyc_status === "pending" ? (
          <p className="text-muted">
            {t("kyc.pendingDesc", {
              defaultValue: "Your documents are under review. This typically takes 24-48 hours.",
            })}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="max-w-md space-y-4">
            <div>
              <Label htmlFor="docType">{t("kyc.documentType", { defaultValue: "Document Type" })}</Label>
              <select id="docType" value={docType} onChange={(e) => setDocType(e.target.value)} className="select-input mt-2">
                <option value="passport">{t("kyc.passport", { defaultValue: "Passport" })}</option>
                <option value="drivers_license">{t("kyc.driversLicense", { defaultValue: "Driver's License" })}</option>
                <option value="national_id">{t("kyc.nationalId", { defaultValue: "National ID" })}</option>
              </select>
            </div>
            <div>
              <Label htmlFor="document">{t("kyc.uploadDocument", { defaultValue: "Upload Document" })}</Label>
              <Input id="document" name="document" type="file" accept="image/*,.pdf" required className="mt-2" />
            </div>
            {message && <p className="text-sm text-muted">{message}</p>}
            <Button type="submit" disabled={loading} className="rounded-full">
              <Upload className="mr-2 h-4 w-4" />
              {loading ? t("common.saving") : t("kyc.submit", { defaultValue: "Submit for Review" })}
            </Button>
          </form>
        )}
      </DashboardSheet>
    </div>
  );
}
