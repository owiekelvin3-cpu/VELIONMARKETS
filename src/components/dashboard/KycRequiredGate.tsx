import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { isKycApproved, getKycStatus } from "@/lib/kyc";
import { FileCheck, ShieldCheck } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { DashboardSheet } from "@/components/dashboard/DashboardSheet";
import type { ReactNode } from "react";

/** Blocks transactional UI until KYC is approved. */
export function KycRequiredGate({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
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

  return (
    <DashboardSheet className={className}>
      <div className="mx-auto flex max-w-lg flex-col items-center py-6 text-center sm:py-8">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald/10 text-emerald">
          {status === "approved" ? <ShieldCheck className="h-7 w-7" /> : <FileCheck className="h-7 w-7" />}
        </div>
        <h2 className="font-display text-xl font-semibold text-foreground">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">{desc}</p>
        <Button asChild className="mt-6 rounded-full">
          <Link to="/dashboard/kyc">
            <FileCheck className="h-4 w-4" />
            {status === "pending" ? t("kyc.gateViewStatus") : t("kyc.gateCta")}
          </Link>
        </Button>
      </div>
    </DashboardSheet>
  );
}
