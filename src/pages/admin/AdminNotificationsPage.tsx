import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabase";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { UserSelect } from "@/components/admin/UserSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminNotificationsPage() {
  const { t } = useTranslation();
  const [userId, setUserId] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSent(false);
    const { error: err } = await supabase.from("notifications").insert({ user_id: userId, title, message });
    if (err) setError(err.message);
    else {
      setSent(true);
      setTitle("");
      setMessage("");
      setUserId("");
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader title={t("admin.notificationsTitle")} subtitle={t("admin.notificationsSubtitle")} />

      <AdminPanel title={t("admin.sendNotification")}>
        <form onSubmit={handleSend} className="max-w-md space-y-4">
          <div>
            <Label>{t("admin.selectUser")}</Label>
            <UserSelect value={userId} onChange={setUserId} className="mt-2" />
          </div>
          <div>
            <Label>{t("admin.notificationTitle")}</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required className="mt-2" />
          </div>
          <div>
            <Label>{t("admin.notificationMessage")}</Label>
            <Input value={message} onChange={(e) => setMessage(e.target.value)} required className="mt-2" />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button type="submit" disabled={submitting}>{t("admin.send")}</Button>
          {sent && <p className="text-sm text-emerald">{t("admin.notificationSent")}</p>}
        </form>
      </AdminPanel>
    </div>
  );
}
