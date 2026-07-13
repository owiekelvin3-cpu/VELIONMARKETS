import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabase";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingScreen } from "@/components/ui/loading-screen";

export default function AdminSettingsPage() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await supabase.from("platform_settings").select("*");
    if (err) setError(err.message);
    else {
      const map: Record<string, string> = {};
      data?.forEach((s) => { map[s.key] = String(s.value); });
      setSettings(map);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const { error: err } = await supabase.from("platform_settings").upsert({ key, value });
    if (err) setError(err.message);
    else {
      setSettings((prev) => ({ ...prev, [key]: value }));
      setMessage(t("admin.settingSaved"));
      setKey("");
      setValue("");
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader title={t("admin.settingsTitle")} subtitle={t("admin.settingsSubtitle")} />

      {error && <p className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">{error}</p>}

      <AdminPanel title={t("admin.addSetting")}>
        <form onSubmit={handleSave} className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div className="min-w-0">
            <Label>{t("admin.key")}</Label>
            <Input value={key} onChange={(e) => setKey(e.target.value)} required className="mt-2" />
          </div>
          <div className="min-w-0">
            <Label>{t("admin.value")}</Label>
            <Input value={value} onChange={(e) => setValue(e.target.value)} required className="mt-2" />
          </div>
          <Button type="submit" className="w-full sm:w-auto">{t("admin.save")}</Button>
        </form>
        {message && <p className="mt-3 text-sm text-emerald">{message}</p>}
      </AdminPanel>

      <AdminPanel title={t("admin.currentSettings")}>
        {loading ? (
          <LoadingScreen />
        ) : Object.keys(settings).length === 0 ? (
          <p className="text-sm text-muted">{t("admin.noSettings")}</p>
        ) : (
          <div className="space-y-2">
            {Object.entries(settings).map(([k, v]) => (
              <div key={k} className="flex flex-col gap-1 rounded-lg border border-border bg-secondary/50 px-4 py-3 text-sm sm:flex-row sm:justify-between sm:gap-4">
                <span className="shrink-0 font-medium text-foreground">{k}</span>
                <span className="min-w-0 break-all text-muted sm:text-right">{v}</span>
              </div>
            ))}
          </div>
        )}
      </AdminPanel>
    </div>
  );
}
