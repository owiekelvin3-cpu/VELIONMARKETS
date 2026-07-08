import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileCheck, Upload } from "@/lib/icons";

export default function KYCPage() {
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
      setMessage("KYC documents submitted for review.");
    } else {
      setMessage(error.message);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="KYC Verification" />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            Identity Verification
          </CardTitle>
          <Badge variant={statusColors[profile?.kyc_status || "none"]}>
            {profile?.kyc_status === "none" ? "Not Submitted" : profile?.kyc_status}
          </Badge>
        </CardHeader>
        <CardContent>
          {profile?.kyc_status === "approved" ? (
            <p className="text-muted">Your identity has been verified. You have full access to all platform features.</p>
          ) : profile?.kyc_status === "pending" ? (
            <p className="text-muted">Your documents are under review. This typically takes 24-48 hours.</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
              <div>
                <Label htmlFor="docType">Document Type</Label>
                <select id="docType" value={docType} onChange={(e) => setDocType(e.target.value)} className="select-input">
                  <option value="passport">Passport</option>
                  <option value="drivers_license">Driver&apos;s License</option>
                  <option value="national_id">National ID</option>
                </select>
              </div>
              <div>
                <Label htmlFor="document">Upload Document</Label>
                <Input id="document" name="document" type="file" accept="image/*,.pdf" required />
              </div>
              {message && <p className="text-sm text-muted">{message}</p>}
              <Button type="submit" disabled={loading}>
                <Upload className="mr-2 h-4 w-4" />
                {loading ? "Submitting..." : "Submit for Review"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
