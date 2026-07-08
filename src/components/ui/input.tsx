import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        "flex h-12 w-full rounded-xl border border-white/10 px-4 py-2 text-sm text-foreground transition-all duration-300",
        "bg-gradient-to-b from-white/[0.06] to-white/[0.02]",
        "placeholder:text-muted/70",
        "focus-visible:outline-none focus-visible:border-emerald/40 focus-visible:ring-[3px] focus-visible:ring-emerald/15",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
