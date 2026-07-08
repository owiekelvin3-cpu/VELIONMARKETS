import { cn } from "@/lib/utils";
import type { IconComponent } from "@/lib/icons";

interface AdminStatCardProps {
  label: string;
  value: string | number;
  icon: IconComponent;
  trend?: string;
  accent?: "emerald" | "gold" | "blue" | "red";
  loading?: boolean;
}

const ACCENT = {
  emerald: "bg-emerald/10 text-emerald",
  gold: "bg-gold/10 text-gold",
  blue: "bg-blue-500/10 text-blue-400",
  red: "bg-red-500/10 text-red-400",
};

export function AdminStatCard({ label, value, icon: Icon, trend, accent = "emerald", loading }: AdminStatCardProps) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
      <div className="flex items-start justify-between">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", ACCENT[accent])}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        {trend && <span className="text-xs text-muted">{trend}</span>}
      </div>
      <p className="mt-4 text-xs font-medium uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold text-foreground">
        {loading ? "—" : value}
      </p>
    </div>
  );
}
