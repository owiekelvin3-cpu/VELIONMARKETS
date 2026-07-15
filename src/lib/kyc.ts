import type { Profile } from "@/types/database";

export type KycStatus = "none" | "pending" | "approved" | "rejected";

export function getKycStatus(profile: Pick<Profile, "kyc_status"> | null | undefined): KycStatus {
  const status = profile?.kyc_status;
  if (status === "pending" || status === "approved" || status === "rejected") return status;
  return "none";
}

export function isKycApproved(profile: Pick<Profile, "kyc_status"> | null | undefined): boolean {
  return getKycStatus(profile) === "approved";
}
