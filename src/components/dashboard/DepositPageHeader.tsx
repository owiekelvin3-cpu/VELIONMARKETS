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
    <FadeIn className="mb-8">
      <Link
        to={backTo}
        className="mb-5 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03] text-muted transition-colors hover:bg-white/[0.06] hover:text-foreground"
        aria-label="Go back"
      >
        <ArrowLeft className="h-4 w-4" />
      </Link>
      <h1 className="font-display text-2xl font-bold text-foreground">{title}</h1>
      {subtitle && <p className="mt-1.5 text-sm text-muted">{subtitle}</p>}
    </FadeIn>
  );
}
