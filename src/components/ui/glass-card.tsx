import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  elevated?: boolean;
}

export function GlassCard({
  children,
  className,
  hover = true,
  glow = false,
  elevated = false,
}: GlassCardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -6 } : undefined}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "rounded-2xl p-6 md:p-8",
        elevated ? "card-elevated" : "glass",
        !elevated && hover && "transition-all duration-500 hover:border-emerald/20 hover:shadow-[0_24px_64px_rgba(0,0,0,0.45),0_0_32px_rgba(16,185,129,0.06)]",
        glow && "glow-emerald-sm",
        className
      )}
    >
      {children}
    </motion.div>
  );
}

export function GlassCardStrong({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn("glass-strong rounded-3xl p-8 md:p-10", className)}
    >
      {children}
    </motion.div>
  );
}
