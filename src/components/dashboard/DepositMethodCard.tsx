import { Link } from "react-router-dom";
import { ChevronRight } from "@/lib/icons";
import { cn } from "@/lib/utils";

interface DepositMethodCardProps {
  to: string;
  title: string;
  description: string;
  iconGrid: React.ReactNode;
  iconRow: React.ReactNode;
}

export function DepositMethodCard({
  to,
  title,
  description,
  iconGrid,
  iconRow,
}: DepositMethodCardProps) {
  return (
    <Link
      to={to}
      className={cn(
        "group flex items-center gap-4 rounded-2xl border border-border bg-secondary/50 p-5",
        "transition-all duration-200 hover:border-emerald/25 hover:bg-secondary/70 hover:shadow-[0_0_32px_rgba(16,185,129,0.06)]"
      )}
    >
      {iconGrid}
      <div className="min-w-0 flex-1">
        <h3 className="font-display text-base font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-muted">{description}</p>
        <div className="mt-3">{iconRow}</div>
      </div>
      <ChevronRight
        className="h-5 w-5 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-emerald"
        aria-hidden="true"
      />
    </Link>
  );
}
