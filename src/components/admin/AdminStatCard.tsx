import { cn } from "@/lib/utils";
import type { IconComponent } from "@/lib/icons";

interface AdminStatCardProps {
  label: string;
  value: string | number;
  icon: IconComponent;
  trend?: string;
  accent?: "emerald" | "gold" | "blue" | "red";
  loading?: boolean;
  className?: string;
}

const ACCENT = {
  emerald: "bg-emerald/12 text-emerald ring-emerald/20",
  gold: "bg-gold/12 text-gold ring-gold/25",
  blue: "bg-sky-500/12 text-sky-400 ring-sky-500/20",
  red: "bg-red-500/12 text-red-400 ring-red-500/20",
};

export function AdminStatCard({
  label,
  value,
  icon: Icon,
  trend,
  accent = "emerald",
  loading,
  className,
}: AdminStatCardProps) {
  return (
    <div className={cn("admin-stat group", className)}>
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-2xl ring-1 transition-transform group-hover:scale-[1.03]",
            ACCENT[accent]
          )}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        {trend && <span className="text-xs text-muted">{trend}</span>}
      </div>
      <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{label}</p>
      {loading ? (
        <div className="mt-2 h-8 w-20 animate-pulse rounded-lg bg-secondary/70" />
      ) : (
        <p className="mt-1.5 truncate font-display text-2xl font-semibold tracking-tight text-foreground">{value}</p>
      )}
    </div>
  );
}
