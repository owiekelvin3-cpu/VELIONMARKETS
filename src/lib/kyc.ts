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

/** Map Supabase/RLS errors to friendly copy when KYC blocks a transaction. */
export function formatTransactionError(error: unknown, fallback: string, kycMessage: string): string {
  if (!error) return fallback;
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error !== null && "message" in error
        ? String((error as { message: unknown }).message)
        : String(error);
  if (/row-level security|violates row-level security|KYC verification required/i.test(message)) {
    return kycMessage;
  }
  return message || fallback;
}
