import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();

  return (
    <FadeIn className="mb-5 sm:mb-6">
      <Link
        to={backTo}
        className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-secondary/40 text-muted transition-colors hover:bg-secondary hover:text-foreground"
        aria-label={t("support.back")}
      >
        <ArrowLeft className="h-4 w-4" />
      </Link>
      <h1 className="font-display text-[1.35rem] font-semibold tracking-tight text-foreground sm:text-2xl">
        {title}
      </h1>
      {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
    </FadeIn>
  );
}
