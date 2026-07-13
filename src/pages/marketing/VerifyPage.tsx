import { useState } from "react";
import { useTranslation } from "react-i18next";
import { PageHero } from "@/components/marketing/PageHero";
import { FadeIn } from "@/components/motion/Motion";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { Search, CheckCircle, XCircle } from "@/lib/icons";

interface Certificate {
  certificate_id: string;
  holder_name: string;
  issue_date: string;
  type: string;
  verified: boolean;
}

export default function VerifyPage() {
  const { t } = useTranslation();
  const [certId, setCertId] = useState("");
  const [result, setResult] = useState<Certificate | null>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSearched(true);
    const { data } = await supabase.from("certificates").select("*").eq("certificate_id", certId.trim()).single();
    setResult(data);
    setLoading(false);
  };

  return (
    <>
      <PageHero badge={t("pages.verifyBadge")} title={t("pages.verifyTitle")} subtitle={t("pages.verifySubtitle")} />
      <section className="pb-24">
        <div className="container mx-auto px-4">
          <FadeIn className="mx-auto max-w-md">
            <GlassCard>
              <form onSubmit={handleVerify} className="space-y-4">
                <div>
                  <Label htmlFor="certId" className="text-muted">{t("pages.verifyCertId")}</Label>
                  <Input id="certId" value={certId} onChange={(e) => setCertId(e.target.value)} placeholder="TRD-XXXX-XXXX" required className="mt-2" />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  <Search className="mr-2 h-4 w-4" />
                  {loading ? t("pages.verifying") : t("pages.verifyBtn")}
                </Button>
              </form>
              {searched && !loading && (
                <div className="mt-6">
                  {result ? (
                    <div className="rounded-xl border border-emerald/20 bg-emerald/5 p-4">
                      <div className="flex items-center gap-2 text-emerald">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-semibold">{t("pages.verified")}</span>
                      </div>
                      <div className="mt-3 space-y-1 text-sm text-muted">
                        <p><strong className="text-foreground">{t("pages.holder")}:</strong> {result.holder_name}</p>
                        <p><strong className="text-foreground">{t("pages.type")}:</strong> {result.type}</p>
                        <p><strong className="text-foreground">{t("pages.issued")}:</strong> {result.issue_date}</p>
                        <Badge variant="success" className="mt-2">{t("pages.authentic")}</Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                      <div className="flex items-center gap-2 text-red-400">
                        <XCircle className="h-5 w-5" />
                        <span className="font-semibold">{t("pages.notFound")}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </GlassCard>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
