import { supabase } from "@/lib/supabase";
import { CRYPTO_ASSETS } from "@/constants/deposit-assets";
import {
  CRYPTO_PURCHASE_PARTNERS,
  GIFT_CARD_PURCHASE_PARTNERS,
  type PurchasePartner,
} from "@/constants/purchase-partners";

export const DEPOSIT_CONFIG_KEY = "deposit_config";

export interface DepositPlatformConfig {
  cryptoWallets: Record<string, string>;
  cryptoPartners: PurchasePartner[];
  giftCardPartners: PurchasePartner[];
}

const DEFAULT_WALLETS: Record<string, string> = {
  bitcoin: "bc1qvelion7x8k2mdepositwallet9f4h2j",
  ethereum: "0xVelion742DepositWallet8a3f9c2e1b",
  usdt: "0xVelion742DepositWallet8a3f9c2e1b",
  bnb: "0xVelion742DepositWallet8a3f9c2e1b",
  solana: "VelionDep0s1tWa11etSo1ana9xK2m",
  xrp: "rVelionDepositWallet9XRP8k2m4n",
  litecoin: "ltc1qveliondepositwallet7k2m9x",
  dogecoin: "DVelionDepositWallet9DOGE2k",
};

export function getDefaultDepositConfig(): DepositPlatformConfig {
  return {
    cryptoWallets: { ...DEFAULT_WALLETS },
    cryptoPartners: CRYPTO_PURCHASE_PARTNERS.map((p) => ({ ...p })),
    giftCardPartners: GIFT_CARD_PURCHASE_PARTNERS.map((p) => ({ ...p })),
  };
}

function normalizePartners(partners: unknown, fallback: PurchasePartner[]): PurchasePartner[] {
  if (!Array.isArray(partners) || partners.length === 0) return fallback.map((p) => ({ ...p }));

  return partners
    .filter((p): p is PurchasePartner => typeof p === "object" && p !== null && "id" in p && "url" in p)
    .map((p) => ({
      id: String(p.id),
      name: String(p.name ?? p.id),
      url: String(p.url),
      color: String(p.color ?? "#2563EB"),
      description: p.description ? String(p.description) : undefined,
      descriptionKey: p.descriptionKey ? String(p.descriptionKey) : undefined,
      logoUrl: p.logoUrl ? String(p.logoUrl) : undefined,
      tag: p.tag ? String(p.tag) : undefined,
      tagKey: p.tagKey ? String(p.tagKey) : undefined,
      enabled: p.enabled !== false,
    }));
}

function normalizeWallets(wallets: unknown, fallback: Record<string, string>): Record<string, string> {
  const base = { ...fallback };
  if (!wallets || typeof wallets !== "object") return base;

  for (const asset of CRYPTO_ASSETS) {
    const value = (wallets as Record<string, unknown>)[asset.id];
    if (typeof value === "string" && value.trim()) {
      base[asset.id] = value.trim();
    }
  }
  return base;
}

export function mergeDepositConfig(raw: unknown): DepositPlatformConfig {
  const defaults = getDefaultDepositConfig();
  if (!raw || typeof raw !== "object") return defaults;

  const data = raw as Partial<DepositPlatformConfig>;
  return {
    cryptoWallets: normalizeWallets(data.cryptoWallets, defaults.cryptoWallets),
    cryptoPartners: normalizePartners(data.cryptoPartners, defaults.cryptoPartners),
    giftCardPartners: normalizePartners(data.giftCardPartners, defaults.giftCardPartners),
  };
}

export async function fetchDepositConfig(): Promise<DepositPlatformConfig> {
  const { data, error } = await supabase
    .from("platform_settings")
    .select("value")
    .eq("key", DEPOSIT_CONFIG_KEY)
    .maybeSingle();

  if (error) throw error;
  return mergeDepositConfig(data?.value);
}

export async function saveDepositConfig(config: DepositPlatformConfig): Promise<void> {
  const { error } = await supabase.from("platform_settings").upsert(
    {
      key: DEPOSIT_CONFIG_KEY,
      value: config,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" }
  );
  if (error) throw error;
}

export function getCryptoWallet(config: DepositPlatformConfig, assetId: string): string {
  return config.cryptoWallets[assetId] ?? DEFAULT_WALLETS[assetId] ?? "";
}

export function getActivePartners(partners: PurchasePartner[]): PurchasePartner[] {
  return partners.filter((p) => p.enabled !== false);
}
