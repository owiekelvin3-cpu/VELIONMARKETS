import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Elevated content sheet used across dashboard pages. */
export function DashboardSheet({
  children,
  className,
  flush,
}: {
  children: ReactNode;
  className?: string;
  /** Drop horizontal padding when the child manages its own. */
  flush?: boolean;
}) {
  return (
    <section className={cn("dashboard-sheet", flush && "px-0 sm:px-0", className)}>
      {children}
    </section>
  );
}
