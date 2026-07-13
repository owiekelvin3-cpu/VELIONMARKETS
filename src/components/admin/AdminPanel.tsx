import { cn } from "@/lib/utils";

interface AdminPanelProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export function AdminPanel({ title, description, children, className, action }: AdminPanelProps) {
  return (
    <div className={cn("rounded-2xl border border-border bg-secondary/50", className)}>
      {(title || action) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-3 py-3 sm:px-5 sm:py-4">
          <div className="min-w-0">
            {title && <h2 className="font-display font-semibold text-foreground">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
          </div>
          {action}
        </div>
      )}
      <div className="p-3 sm:p-5">{children}</div>
    </div>
  );
}
