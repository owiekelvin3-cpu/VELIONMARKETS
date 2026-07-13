import { supabase } from "@/lib/supabase";
import type { Profile, TransactionStatus } from "@/types/database";

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

export interface AdminUserDetails {
  profile: Profile;
  balance: number;
  auth: AdminUserAuthInfo;
  stats: AdminUserStats;
  recent_deposits: Array<{ id: string; amount: number; method: string; status: string; created_at: string }>;
  recent_withdrawals: Array<{ id: string; amount: number; method: string; status: string; wallet_address: string | null; created_at: string }>;
  kyc_submissions: Array<{ id: string; document_type: string; document_url: string | null; status: string; notes: string | null; created_at: string }>;
}

export async function fetchAdminUserDetails(userId: string): Promise<AdminUserDetails> {
  const { data, error } = await supabase.rpc("admin_get_user_details", { p_user_id: userId });
  if (error) throw error;
  return data as AdminUserDetails;
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

export async function completeWithdrawal(withdrawalId: string, userId: string, amount: number) {
  const { data: bal } = await supabase.from("balances").select("amount").eq("user_id", userId).single();
  const current = bal?.amount ?? 0;
  if (current < amount) throw new Error("Insufficient user balance for this withdrawal.");

  const { error: wErr } = await supabase
    .from("withdrawals")
    .update({ status: "completed" as TransactionStatus })
    .eq("id", withdrawalId);
  if (wErr) throw wErr;

  const { error: balErr } = await supabase
    .from("balances")
    .upsert({ user_id: userId, amount: current - amount, currency: "USD" }, { onConflict: "user_id" });
  if (balErr) throw balErr;
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
