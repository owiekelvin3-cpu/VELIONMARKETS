import { Link } from "react-router-dom";
import { ArrowLeft } from "@/lib/icons";
import { FadeIn } from "@/components/motion/Motion";

export function DepositPageHeader({
  title,
  subtitle,
  backTo = "/dashboard",
}: {
  title: string;
  subtitle?: string;
  backTo?: string;
}) {
  return (
    <FadeIn className="mb-6 sm:mb-8">
      <Link
        to={backTo}
        className="mb-4 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-secondary/40 text-muted transition-colors hover:bg-secondary hover:text-foreground"
        aria-label="Go back"
      >
        <ArrowLeft className="h-4 w-4" />
      </Link>
      <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
      {subtitle && <p className="mt-1.5 text-sm text-muted">{subtitle}</p>}
    </FadeIn>
  );
}
