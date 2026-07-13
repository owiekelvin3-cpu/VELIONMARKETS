import { BRAND } from "@/constants/brand";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  iconClassName?: string;
  wordmarkClassName?: string;
  showWordmark?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "gold";
}

const sizes = {
  sm: { icon: "h-7 w-7", word: "text-[15px]", gap: "gap-2" },
  md: { icon: "h-8 w-8", word: "text-[17px]", gap: "gap-2.5" },
  lg: { icon: "h-9 w-9", word: "text-[19px]", gap: "gap-3" },
};

/**
 * TradingView-style mark: three ascending bars + clean single-line wordmark.
 * Flat, geometric, no plate / glow / sparkles.
 */
export function LogoIcon({
  className,
  variant = "default",
}: {
  className?: string;
  variant?: "default" | "gold";
}) {
  const fill = variant === "gold" ? BRAND.colors.gold : BRAND.colors.emerald;

  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Ascending market bars — TradingView-caliber simplicity */}
      <rect x="2" y="18" width="7" height="12" rx="1.5" fill={fill} opacity="0.55" />
      <rect x="12.5" y="10" width="7" height="20" rx="1.5" fill={fill} opacity="0.8" />
      <rect x="23" y="2" width="7" height="28" rx="1.5" fill={fill} />
    </svg>
  );
}

export function Logo({
  className,
  iconClassName,
  wordmarkClassName,
  showWordmark = true,
  size = "md",
  variant = "default",
}: LogoProps) {
  const s = sizes[size];

  return (
    <span className={cn("inline-flex items-center", s.gap, className)}>
      <LogoIcon className={cn(s.icon, "shrink-0", iconClassName)} variant={variant} />
      {showWordmark && (
        <span
          className={cn(
            "inline-flex items-baseline gap-[0.35em] font-display font-semibold tracking-tight",
            s.word,
            wordmarkClassName
          )}
        >
          <span className="text-foreground">
            {BRAND.shortName.charAt(0) + BRAND.shortName.slice(1).toLowerCase()}
          </span>
          <span
            className={cn(
              "font-semibold",
              variant === "gold" ? "text-gold" : "text-emerald"
            )}
          >
            {BRAND.wordmarkSuffix.charAt(0) + BRAND.wordmarkSuffix.slice(1).toLowerCase()}
          </span>
        </span>
      )}
    </span>
  );
}
