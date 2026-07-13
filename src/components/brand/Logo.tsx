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
  sm: { icon: "h-8 w-8", primary: "text-sm", suffix: "text-[9px]" },
  md: { icon: "h-10 w-10", primary: "text-base", suffix: "text-[10px]" },
  lg: { icon: "h-11 w-11", primary: "text-lg", suffix: "text-[11px]" },
};

export function LogoIcon({
  className,
  variant = "default",
}: {
  className?: string;
  variant?: "default" | "gold";
}) {
  const gradId = variant === "gold" ? "velion-gold" : "velion-emerald";
  const accent = variant === "gold" ? BRAND.colors.gold : BRAND.colors.emerald;
  const accentDeep = variant === "gold" ? "#CA8A04" : BRAND.colors.emeraldGlow;

  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="velion-emerald" x1="6" y1="4" x2="34" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor={BRAND.colors.emeraldSoft} />
          <stop offset="1" stopColor={BRAND.colors.emeraldGlow} />
        </linearGradient>
        <linearGradient id="velion-gold" x1="6" y1="4" x2="34" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FDE047" />
          <stop offset="1" stopColor="#CA8A04" />
        </linearGradient>
        <linearGradient id="velion-bg" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor={BRAND.colors.slate} />
          <stop offset="1" stopColor={BRAND.colors.navy} />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill="url(#velion-bg)" />
      <rect
        width="40"
        height="40"
        rx="11"
        fill={variant === "gold" ? "url(#velion-gold)" : "url(#velion-emerald)"}
        fillOpacity="0.14"
      />
      <rect
        x="0.5"
        y="0.5"
        width="39"
        height="39"
        rx="10.5"
        stroke={accent}
        strokeOpacity="0.4"
      />
      <path
        d="M11 13.5L20 29.5L29 13.5"
        stroke={`url(#${gradId})`}
        strokeWidth="2.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14.5 18.5L20 27L25.5 18.5"
        stroke={accentDeep}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity="0.65"
      />
      <path
        d="M24 12.5L29.5 10.5L33 14"
        stroke={BRAND.colors.gold}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="33" cy="14" r="1.5" fill={BRAND.colors.gold} />
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
    <span className={cn("inline-flex items-center gap-3", className)}>
      <LogoIcon className={cn(s.icon, "shrink-0", iconClassName)} variant={variant} />
      {showWordmark && (
        <span className={cn("flex flex-col leading-none", wordmarkClassName)}>
          <span
            className={cn(
              "font-display font-bold tracking-[0.12em] text-foreground",
              s.primary
            )}
          >
            {BRAND.shortName}
          </span>
          <span
            className={cn(
              "mt-0.5 font-display font-medium tracking-[0.28em] text-emerald",
              s.suffix
            )}
          >
            {BRAND.wordmarkSuffix}
          </span>
        </span>
      )}
    </span>
  );
}
