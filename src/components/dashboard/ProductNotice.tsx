import { ShieldCheck, AlertTriangle } from "@/lib/icons";
import { cn } from "@/lib/utils";

interface ProductNoticeProps {
  title: string;
  body: string;
  variant?: "trust" | "risk";
  className?: string;
}

/** Compact compliance/trust callout for product pages. */
export function ProductNotice({ title, body, variant = "trust", className }: ProductNoticeProps) {
  const Icon = variant === "risk" ? AlertTriangle : ShieldCheck;
  return (
    <div
      className={cn(
        "flex gap-3 rounded-2xl border px-4 py-3.5",
        variant === "risk"
          ? "border-amber-500/20 bg-amber-500/[0.06]"
          : "border-border/70 bg-secondary/30",
        className
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
          variant === "risk" ? "bg-amber-500/15 text-amber-400" : "bg-emerald/12 text-emerald"
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted">{body}</p>
      </div>
    </div>
  );
}
