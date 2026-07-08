import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types/database";
import { cn } from "@/lib/utils";

interface UserSelectProps {
  value: string;
  onChange: (userId: string) => void;
  className?: string;
}

export function UserSelect({ value, onChange, className }: UserSelectProps) {
  const { t } = useTranslation();
  const [users, setUsers] = useState<Profile[]>([]);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("*")
      .order("full_name", { ascending: true })
      .then(({ data }) => setUsers(data ?? []));
  }, []);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn("select-input h-11 w-full", className)}
      required
    >
      <option value="">{t("admin.selectUser")}…</option>
      {users.map((u) => (
        <option key={u.id} value={u.id}>
          {u.full_name || u.email} ({u.email})
        </option>
      ))}
    </select>
  );
}
