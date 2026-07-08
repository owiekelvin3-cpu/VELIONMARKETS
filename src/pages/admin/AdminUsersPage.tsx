import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabase";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { LoadingScreen } from "@/components/ui/loading-screen";
import type { Profile } from "@/types/database";

export default function AdminUsersPage() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const { data, error: err } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (err) setError(err.message);
    else setUsers(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    const { error: err } = await supabase.from("profiles").update({ role: newRole }).eq("id", userId);
    if (err) setError(err.message);
    else load();
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader title={t("admin.usersTitle")} subtitle={t("admin.usersSubtitle")} />

      {error && <p className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">{error}</p>}

      <AdminPanel title={`${t("admin.allUsers")} (${users.length})`}>
        {loading ? (
          <LoadingScreen />
        ) : users.length === 0 ? (
          <p className="text-sm text-muted">{t("admin.noUsers")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>{t("admin.name")}</th>
                  <th>{t("admin.email")}</th>
                  <th>{t("admin.role")}</th>
                  <th>{t("admin.kyc")}</th>
                  <th>{t("admin.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="font-medium">{u.full_name || "—"}</td>
                    <td className="text-muted">{u.email}</td>
                    <td><StatusBadge status={u.role} /></td>
                    <td><StatusBadge status={u.kyc_status} /></td>
                    <td>
                      <Button variant="outline" size="sm" className="border-white/10" onClick={() => toggleRole(u.id, u.role)}>
                        {u.role === "admin" ? t("admin.demote") : t("admin.makeAdmin")}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminPanel>
    </div>
  );
}
