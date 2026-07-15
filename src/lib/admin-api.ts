import { supabase } from "@/lib/supabase";
import type { Profile, TransactionStatus, UserFee, UserFeeStatus } from "@/types/database";

export interface AdminUserAuthInfo {
  created_at: string | null;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  phone: string | null;
  has_password: boolean;
  providers: string[];
}

export interface AdminUserStats {
  deposits_count: number;
  deposits_total: number;
  withdrawals_count: number;
  withdrawals_total: number;
  trades_count: number;
  active_trades: number;
  ai_bots_active: number;
}

export type AdminModerationActionType =
  | "suspend"
  | "unsuspend"
  | "reset_kyc"
  | "make_admin"
  | "demote"
  | "note";

export interface AdminModerationAction {
  id: string;
  action_type: AdminModerationActionType;
  reason: string;
  created_at: string;
  admin_id: string;
  admin_email: string | null;
  admin_name: string | null;
}

export interface AdminUserDetails {
  profile: Profile;
  balance: number;
  outstanding_fees_total: number;
  auth: AdminUserAuthInfo;
  stats: AdminUserStats;
  fees: UserFee[];
  recent_deposits: Array<{ id: string; amount: number; method: string; status: string; created_at: string }>;
  recent_withdrawals: Array<{ id: string; amount: number; method: string; status: string; wallet_address: string | null; created_at: string }>;
  kyc_submissions: Array<{
    id: string;
    document_type: string;
    document_url: string | null;
    selfie_url: string | null;
    face_captured_at: string | null;
    status: string;
    notes: string | null;
    created_at: string;
  }>;
  moderation_actions: AdminModerationAction[];
}

export async function fetchAdminUserDetails(userId: string): Promise<AdminUserDetails> {
  const { data, error } = await supabase.rpc("admin_get_user_details", { p_user_id: userId });
  if (error) throw error;
  const details = data as AdminUserDetails;
  return {
    ...details,
    outstanding_fees_total: Number(details.outstanding_fees_total ?? 0),
    fees: details.fees ?? [],
    moderation_actions: details.moderation_actions ?? [],
  };
}

export async function moderateAdminUser(params: {
  userId: string;
  action: AdminModerationActionType;
  reason: string;
}) {
  const { data, error } = await supabase.rpc("admin_moderate_user", {
    p_user_id: params.userId,
    p_action: params.action,
    p_reason: params.reason.trim(),
  });
  if (error) throw error;
  return data;
}

export async function assignUserFee(params: {
  userId: string;
  feeType: string;
  label: string;
  amount: number;
  notes?: string;
}): Promise<UserFee> {
  const { data, error } = await supabase.rpc("admin_assign_user_fee", {
    p_user_id: params.userId,
    p_fee_type: params.feeType,
    p_label: params.label,
    p_amount: params.amount,
    p_notes: params.notes ?? null,
  });
  if (error) throw error;
  return data as UserFee;
}

export async function updateUserFeeStatus(
  feeId: string,
  status: Extract<UserFeeStatus, "paid" | "waived" | "cancelled">
): Promise<UserFee> {
  const { data, error } = await supabase.rpc("admin_update_user_fee_status", {
    p_fee_id: feeId,
    p_status: status,
  });
  if (error) throw error;
  return data as UserFee;
}

export async function updateAdminUserProfile(
  userId: string,
  fields: Partial<Pick<Profile, "country" | "city" | "timezone" | "last_known_ip" | "last_known_location" | "full_name" | "phone" | "bio" | "kyc_status" | "role">>
) {
  const { error } = await supabase.from("profiles").update(fields).eq("id", userId);
  if (error) throw error;
}

export async function sendUserPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth`,
  });
  if (error) throw error;
}

export async function approveDeposit(depositId: string, userId: string, amount: number) {
  const { error: depErr } = await supabase
    .from("deposits")
    .update({ status: "completed" as TransactionStatus })
    .eq("id", depositId);
  if (depErr) throw depErr;

  const { data: bal } = await supabase.from("balances").select("amount").eq("user_id", userId).single();
  const newAmount = (bal?.amount ?? 0) + amount;
  const { error: balErr } = await supabase
    .from("balances")
    .upsert({ user_id: userId, amount: newAmount, currency: "USD" }, { onConflict: "user_id" });
  if (balErr) throw balErr;
}

export async function rejectDeposit(depositId: string) {
  const { error } = await supabase
    .from("deposits")
    .update({ status: "rejected" as TransactionStatus })
    .eq("id", depositId);
  if (error) throw error;
}

export async function completeWithdrawal(withdrawalId: string, _userId: string, _amount: number) {
  // Balance was already held on insert via hold_balance_for_withdrawal — only flip status.
  const { error: wErr } = await supabase
    .from("withdrawals")
    .update({ status: "completed" as TransactionStatus })
    .eq("id", withdrawalId);
  if (wErr) throw wErr;
}

export async function rejectWithdrawal(withdrawalId: string) {
  const { error } = await supabase
    .from("withdrawals")
    .update({ status: "rejected" as TransactionStatus })
    .eq("id", withdrawalId);
  if (error) throw error;
}

export async function fetchAdminProfile(userId: string) {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
  if (error) throw error;
  return data;
}
