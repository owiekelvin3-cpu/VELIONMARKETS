import { supabase } from "@/lib/supabase";

export type SignalTier = "basic" | "pro" | "vip";
export type SignalDirection = "buy" | "sell";
export type SignalStatus = "active" | "closed" | "cancelled";

export interface TradingSignal {
  id: string;
  symbol: string;
  direction: SignalDirection;
  entry_price: string;
  target_price: string;
  stop_price: string;
  status: SignalStatus;
  min_tier: SignalTier;
  confidence: number;
  outcome: string | null;
  notes: string | null;
  published_at: string;
  closed_at: string | null;
}

export interface SignalSubscription {
  id: string;
  package_id: string | null;
  package_name: string;
  price: number;
  status: string;
  expires_at: string | null;
  created_at: string;
}

export function tierRank(tier: SignalTier | string | null | undefined): number {
  if (tier === "vip") return 3;
  if (tier === "pro") return 2;
  return 1;
}

export function isSubscriptionActive(sub: SignalSubscription): boolean {
  if (sub.status !== "active") return false;
  if (!sub.expires_at) return true;
  return new Date(sub.expires_at).getTime() > Date.now();
}

export function getActiveSignalTier(subs: SignalSubscription[]): SignalTier | null {
  let best = 0;
  let tier: SignalTier | null = null;
  for (const sub of subs) {
    if (!isSubscriptionActive(sub)) continue;
    const rank = tierRank(sub.package_id);
    if (rank > best) {
      best = rank;
      tier = (sub.package_id as SignalTier) || "basic";
    }
  }
  return tier;
}

export async function fetchSignalSubscriptions(userId: string): Promise<SignalSubscription[]> {
  const { data, error } = await supabase
    .from("signal_packages")
    .select("id, package_id, package_name, price, status, expires_at, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({ ...row, price: Number(row.price) }));
}

export async function fetchTradingSignals(): Promise<TradingSignal[]> {
  const { data, error } = await supabase
    .from("trading_signals")
    .select("*")
    .order("published_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as TradingSignal[];
}

export function computeSignalDeskStats(signals: TradingSignal[]) {
  const closed = signals.filter((s) => s.status === "closed");
  const wins = closed.filter((s) => s.outcome === "win" || (!s.outcome && s.direction === "buy")).length;
  const winRate = closed.length > 0 ? Math.round((wins / closed.length) * 100) : null;
  const active = signals.filter((s) => s.status === "active").length;
  return { active, closed: closed.length, winRate };
}

export function riskRewardRatio(signal: TradingSignal): number | null {
  const entry = parseFloat(signal.entry_price);
  const target = parseFloat(signal.target_price);
  const stop = parseFloat(signal.stop_price);
  if (!Number.isFinite(entry) || !Number.isFinite(target) || !Number.isFinite(stop)) return null;
  const reward = Math.abs(target - entry);
  const risk = Math.abs(entry - stop);
  if (risk <= 0) return null;
  return Math.round((reward / risk) * 100) / 100;
}

export function tierLabelKey(tier: SignalTier): string {
  return `signals.packages.${tier}`;
}
