import { supabase } from "@/lib/supabase";
import type { TransactionStatus } from "@/types/database";

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
