import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { isKycApproved, getKycStatus } from "@/lib/kyc";
import { FileCheck, ShieldCheck } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { DashboardSheet } from "@/components/dashboard/DashboardSheet";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/** Blocks transactional UI until KYC is approved. */
export function KycRequiredGate({
  children,
  className,
  /** Compact inline card (e.g. trading order column) instead of full sheet. */
  compact,
}: {
  children: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  const { t } = useTranslation();
  const { profile } = useAuth();

  if (isKycApproved(profile)) return <>{children}</>;

  const status = getKycStatus(profile);
  const title =
    status === "pending"
      ? t("kyc.gatePendingTitle")
      : status === "rejected"
        ? t("kyc.gateRejectedTitle")
        : t("kyc.gateTitle");
  const desc =
    status === "pending"
      ? t("kyc.gatePendingDesc")
      : status === "rejected"
        ? t("kyc.gateRejectedDesc")
        : t("kyc.gateDesc");

  const body = (
    <div className={cn("mx-auto flex max-w-lg flex-col items-center text-center", compact ? "py-4" : "py-6 sm:py-8")}>
      <div className={cn("mb-4 flex items-center justify-center rounded-2xl bg-emerald/10 text-emerald", compact ? "h-11 w-11" : "h-14 w-14")}>
        {status === "approved" ? <ShieldCheck className="h-6 w-6" /> : <FileCheck className={compact ? "h-5 w-5" : "h-7 w-7"} />}
      </div>
      <h2 className={cn("font-display font-semibold text-foreground", compact ? "text-base" : "text-xl")}>{title}</h2>
      <p className={cn("mt-2 leading-relaxed text-muted", compact ? "text-xs" : "text-sm")}>{desc}</p>
      <Button asChild size={compact ? "sm" : "default"} className="mt-5 rounded-full">
        <Link to="/dashboard/kyc">
          <FileCheck className="h-4 w-4" />
          {status === "pending" ? t("kyc.gateViewStatus") : t("kyc.gateCta")}
        </Link>
      </Button>
    </div>
  );

  if (compact) {
    return (
      <div className={cn("rounded-3xl border border-border bg-card/90 p-4 shadow-sm", className)}>
        {body}
      </div>
    );
  }

  return <DashboardSheet className={className}>{body}</DashboardSheet>;
}
