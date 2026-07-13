import * as React from "react";
import { cn } from "@/lib/utils";

const variants = {
  default: "bg-gradient-emerald-subtle text-emerald border-emerald/25",
  secondary: "bg-secondary text-muted border-border",
  success: "bg-gradient-emerald-subtle text-emerald border-emerald/25",
  warning: "bg-gradient-to-r from-yellow-500/15 to-yellow-500/5 text-yellow-400 border-yellow-500/25",
  destructive: "bg-gradient-to-r from-red-500/15 to-red-500/5 text-red-400 border-red-500/25",
};

const Badge = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { variant?: keyof typeof variants }
>(({ className, variant = "default", ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide",
      variants[variant],
      className
    )}
    {...props}
  />
));
Badge.displayName = "Badge";

export { Badge };
