import { supabase } from "@/lib/supabase";

export interface MiningContract {
  id: string;
  package_id: string | null;
  package_name: string;
  investment: number;
  daily_return: number;
  hashrate: string | null;
  term_days: number | null;
  status: string;
  created_at: string;
  expires_at: string | null;
  accrued_profit: number;
  last_accrual_at: string | null;
}

export function computeLiveMiningProfit(contract: MiningContract, at = Date.now()): number {
  const earned = Number(contract.accrued_profit ?? 0);
  if (contract.status !== "active") return earned;

  const expiresAt = contract.expires_at ? new Date(contract.expires_at).getTime() : at;
  const end = Math.min(at, expiresAt);
  const from = new Date(contract.last_accrual_at ?? contract.created_at).getTime();
  const elapsedDays = Math.max((end - from) / 86_400_000, 0);
  if (elapsedDays <= 0) return earned;

  const pending = contract.investment * (contract.daily_return / 100) * elapsedDays;
  return Math.round((earned + pending) * 100) / 100;
}

export function getMiningProgress(contract: MiningContract, at = Date.now()): number {
  if (!contract.expires_at) return 0;
  const start = new Date(contract.created_at).getTime();
  const end = new Date(contract.expires_at).getTime();
  const total = end - start;
  if (total <= 0) return 100;
  return Math.min(100, Math.max(0, ((at - start) / total) * 100));
}

export function getDailyYieldEstimate(investment: number, dailyReturnPct: number): number {
  return Math.round(investment * (dailyReturnPct / 100) * 100) / 100;
}

export function daysRemaining(contract: MiningContract, at = Date.now()): number {
  if (!contract.expires_at) return 0;
  const ms = new Date(contract.expires_at).getTime() - at;
  return Math.max(0, Math.ceil(ms / 86_400_000));
}

export async function syncMiningAccruals(userId: string) {
  const { data, error } = await supabase.rpc("sync_mining_accruals", { p_user_id: userId });
  if (error) throw error;
  return data as { ok: boolean; credited: number; contracts: number };
}

export async function fetchMiningContracts(userId: string): Promise<MiningContract[]> {
  const { data, error } = await supabase
    .from("mining_packages")
    .select(
      "id, package_id, package_name, investment, daily_return, hashrate, term_days, status, created_at, expires_at, accrued_profit, last_accrual_at"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    ...row,
    investment: Number(row.investment),
    daily_return: Number(row.daily_return),
    accrued_profit: Number(row.accrued_profit ?? 0),
  }));
}
