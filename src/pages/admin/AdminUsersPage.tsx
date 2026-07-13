import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Eye, Search } from "@/lib/icons";
import { supabase } from "@/lib/supabase";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { AdminUserDetailPanel } from "@/components/admin/AdminUserDetailPanel";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingScreen } from "@/components/ui/loading-screen";
import type { Profile } from "@/types/database";

export default function AdminUsersPage() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const { data, error: err } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (err) setError(err.message);
    else setUsers(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      u.email.toLowerCase().includes(q)
      || (u.full_name?.toLowerCase().includes(q))
      || u.role.includes(q)
      || u.kyc_status.includes(q)
      || (u.country?.toLowerCase().includes(q))
      || (u.city?.toLowerCase().includes(q))
    );
  }, [users, search]);

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

      <AdminPanel title={`${t("admin.allUsers")} (${filtered.length})`}>
        <div className="mb-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("admin.userDetail.searchPlaceholder")}
              className="pl-9"
            />
          </div>
        </div>

        {loading ? (
          <LoadingScreen />
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted">{t("admin.noUsers")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>{t("admin.name")}</th>
                  <th>{t("admin.email")}</th>
                  <th>{t("admin.userDetail.locationShort")}</th>
                  <th>{t("admin.role")}</th>
                  <th>{t("admin.kyc")}</th>
                  <th>{t("admin.userDetail.joined")}</th>
                  <th>{t("admin.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="cursor-pointer hover:bg-secondary/50" onClick={() => setSelectedUserId(u.id)}>
                    <td className="font-medium">{u.full_name || "—"}</td>
                    <td className="text-muted">{u.email}</td>
                    <td className="text-sm text-muted">
                      {u.city && u.country ? `${u.city}, ${u.country}` : u.country || u.city || "—"}
                    </td>
                    <td><StatusBadge status={u.role} /></td>
                    <td><StatusBadge status={u.kyc_status} /></td>
                    <td className="text-sm text-muted">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button variant="outline" size="sm" className="border-border" onClick={() => setSelectedUserId(u.id)}>
                          <Eye className="mr-1.5 h-3.5 w-3.5" />
                          {t("admin.userDetail.view")}
                        </Button>
                        <Button variant="outline" size="sm" className="border-border" onClick={() => toggleRole(u.id, u.role)}>
                          {u.role === "admin" ? t("admin.demote") : t("admin.makeAdmin")}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminPanel>

      <AdminUserDetailPanel
        userId={selectedUserId}
        onClose={() => setSelectedUserId(null)}
        onUpdated={load}
      />
    </div>
  );
}
