import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/50 focus-visible:ring-offset-2 focus-visible:ring-offset-void disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "rounded-full bg-gradient-emerald text-void shadow-[0_4px_24px_rgba(16,185,129,0.35),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_8px_40px_rgba(16,185,129,0.45)] hover:scale-[1.02]",
        secondary:
          "rounded-full glass text-foreground hover:border-emerald/25 hover:bg-gradient-emerald-subtle",
        outline:
          "rounded-full border border-white/12 bg-gradient-to-b from-white/[0.06] to-transparent text-foreground hover:border-emerald/35 hover:shadow-[0_0_24px_rgba(16,185,129,0.1)]",
        ghost:
          "rounded-full text-muted hover:text-foreground hover:bg-white/5",
        destructive:
          "rounded-full bg-gradient-to-b from-red-500/15 to-red-500/5 text-red-400 border border-red-500/25",
        link: "text-emerald underline-offset-4 hover:underline",
        gold:
          "rounded-full bg-gradient-to-r from-gold-soft via-gold to-[#a68520] text-void shadow-[0_4px_24px_rgba(201,162,39,0.3)] hover:shadow-[0_8px_32px_rgba(201,162,39,0.4)] hover:scale-[1.02]",
      },
      size: {
        default: "h-12 px-8 text-sm",
        sm: "h-10 px-5 text-sm",
        lg: "h-14 px-10 text-base",
        icon: "h-11 w-11 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
