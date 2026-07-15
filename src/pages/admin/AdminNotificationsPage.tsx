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
    if (!userId.trim()) {
      setError(t("admin.selectUser"));
      return;
    }
    setSubmitting(true);
    setError("");
    setSent(false);
    const { error: err } = await supabase.from("notifications").insert({
      user_id: userId,
      title: title.trim(),
      message: message.trim(),
    });
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
        <form onSubmit={handleSend} className="max-w-lg space-y-4">
          <div>
            <Label htmlFor="notif-user">{t("admin.selectUser")}</Label>
            <UserSelect value={userId} onChange={setUserId} className="mt-2" />
          </div>
          <div>
            <Label htmlFor="notif-title">{t("admin.notificationTitle")}</Label>
            <Input
              id="notif-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={120}
              className="mt-2"
              placeholder={t("admin.notificationTitle")}
            />
          </div>
          <div>
            <Label htmlFor="notif-message">{t("admin.notificationMessage")}</Label>
            <textarea
              id="notif-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={4}
              maxLength={500}
              className="mt-2 w-full rounded-xl border border-border bg-secondary/40 px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-emerald/30 focus:outline-none focus:ring-1 focus:ring-emerald/20"
              placeholder={t("admin.notificationMessage")}
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button type="submit" disabled={submitting || !userId}>
            {submitting ? t("common.loading") : t("admin.send")}
          </Button>
          {sent && <p className="text-sm text-emerald">{t("admin.notificationSent")}</p>}
        </form>
      </AdminPanel>
    </div>
  );
}
