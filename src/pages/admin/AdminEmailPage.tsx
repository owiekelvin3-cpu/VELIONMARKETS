import { useState } from "react";
import { useTranslation } from "react-i18next";
import { BRAND } from "@/constants/brand";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminEmailPage() {
  const { t } = useTranslation();
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sent, setSent] = useState(false);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const mailto = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailto);
    setSent(true);
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader title={t("admin.emailTitle")} subtitle={t("admin.emailSubtitle")} />

      <AdminPanel title={t("admin.composeEmail")}>
        <form onSubmit={handleSend} className="max-w-lg space-y-4">
          <div>
            <Label>{t("admin.from")}</Label>
            <Input value={BRAND.supportEmail} disabled className="mt-2" />
          </div>
          <div>
            <Label>{t("admin.to")}</Label>
            <Input type="email" value={to} onChange={(e) => setTo(e.target.value)} required className="mt-2" />
          </div>
          <div>
            <Label>{t("admin.subject")}</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} required className="mt-2" />
          </div>
          <div>
            <Label>{t("admin.body")}</Label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              className="textarea-input mt-2 w-full"
              required
            />
          </div>
          <Button type="submit">{t("admin.openEmailClient")}</Button>
          {sent && <p className="text-sm text-muted">{t("admin.emailClientOpened")}</p>}
        </form>
      </AdminPanel>
    </div>
  );
}
