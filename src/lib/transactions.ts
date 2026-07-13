import { supabase } from "@/lib/supabase";
import type { TransactionStatus } from "@/types/database";

export type TransactionKind = "deposit" | "withdrawal" | "trade";

export interface UserTransaction {
  id: string;
  ref_id: string;
  kind: TransactionKind;
  title: string;
  subtitle: string;
  amount: number;
  status: TransactionStatus | string;
  created_at: string;
  updated_at?: string;
  currency?: string;
  notes?: string | null;
  wallet_address?: string | null;
  asset?: string;
  trade_type?: string;
  quantity?: number;
  unit_price?: number;
}

export const OVERVIEW_TRANSACTION_LIMIT = 5;

function mapDeposit(row: {
  id: string;
  amount: number;
  method: string;
  status: string;
  currency?: string;
  notes?: string | null;
  created_at: string;
  updated_at?: string;
}): UserTransaction {
  return {
    id: `deposit-${row.id}`,
    ref_id: row.id,
    kind: "deposit",
    title: "Deposit",
    subtitle: row.method,
    amount: Number(row.amount),
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    currency: row.currency ?? "USD",
    notes: row.notes,
  };
}

function mapWithdrawal(row: {
  id: string;
  amount: number;
  method: string;
  status: string;
  currency?: string;
  notes?: string | null;
  wallet_address?: string | null;
  created_at: string;
  updated_at?: string;
}): UserTransaction {
  return {
    id: `withdrawal-${row.id}`,
    ref_id: row.id,
    kind: "withdrawal",
    title: "Withdrawal",
    subtitle: row.method,
    amount: Number(row.amount),
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    currency: row.currency ?? "USD",
    notes: row.notes,
    wallet_address: row.wallet_address,
  };
}

function mapTrade(row: {
  id: string;
  asset: string;
  type: string;
  amount: number;
  price: number;
  status: string;
  created_at: string;
}): UserTransaction {
  return {
    id: `trade-${row.id}`,
    ref_id: row.id,
    kind: "trade",
    title: `${row.type.toUpperCase()} ${row.asset}`,
    subtitle: `Qty ${Number(row.amount).toFixed(4)}`,
    amount: Number(row.amount) * Number(row.price),
    status: row.status,
    created_at: row.created_at,
    asset: row.asset,
    trade_type: row.type,
    quantity: Number(row.amount),
    unit_price: Number(row.price),
    currency: "USD",
  };
}

export async function fetchUserTransactions(userId: string): Promise<UserTransaction[]> {
  const [depRes, wdrRes, tradeRes] = await Promise.all([
    supabase
      .from("deposits")
      .select("id, amount, method, status, currency, notes, created_at, updated_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("withdrawals")
      .select("id, amount, method, status, currency, notes, wallet_address, created_at, updated_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("trades")
      .select("id, asset, type, amount, price, status, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
  ]);

  const merged = [
    ...(depRes.data ?? []).map(mapDeposit),
    ...(wdrRes.data ?? []).map(mapWithdrawal),
    ...(tradeRes.data ?? []).map(mapTrade),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return merged;
}

export function localizeTransaction(tx: UserTransaction, t: (key: string) => string): UserTransaction {
  const kindLabel = t(`transactions.kind.${tx.kind}`);
  return {
    ...tx,
    title: tx.kind === "trade" ? tx.title : kindLabel,
  };
}
