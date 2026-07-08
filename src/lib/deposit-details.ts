import { CRYPTO_ASSETS, GIFT_CARD_BRANDS } from "@/constants/deposit-assets";
import type { Deposit } from "@/types/database";

export interface GiftCardDepositMeta {
  type: "gift_card";
  cardCode?: string;
  additionalNotes?: string | null;
  frontImageUrl?: string;
  backImageUrl?: string | null;
}

export interface CryptoDepositMeta {
  type: "crypto";
  txHash?: string;
}

export interface PlainDepositMeta {
  type: "plain";
  text?: string;
}

export type ParsedDepositNotes = GiftCardDepositMeta | CryptoDepositMeta | PlainDepositMeta;

export function parseDepositNotes(notes: string | null, method: string): ParsedDepositNotes {
  if (!notes) {
    return method.startsWith("gift_card_") ? { type: "gift_card" } : { type: "plain" };
  }

  if (notes.trim().startsWith("{")) {
    try {
      const data = JSON.parse(notes) as Record<string, unknown>;
      if ("frontImageUrl" in data || "cardCode" in data) {
        return {
          type: "gift_card",
          cardCode: typeof data.cardCode === "string" ? data.cardCode : undefined,
          additionalNotes: typeof data.additionalNotes === "string" ? data.additionalNotes : null,
          frontImageUrl: typeof data.frontImageUrl === "string" ? data.frontImageUrl : undefined,
          backImageUrl: typeof data.backImageUrl === "string" ? data.backImageUrl : null,
        };
      }
    } catch {
      /* fall through */
    }
  }

  const cryptoIds = CRYPTO_ASSETS.map((c) => c.id);
  if (cryptoIds.includes(method) || method.startsWith("crypto_")) {
    return { type: "crypto", txHash: notes };
  }

  return { type: "plain", text: notes };
}

export function formatDepositMethod(method: string): string {
  if (method.startsWith("gift_card_")) {
    const brandId = method.replace("gift_card_", "");
    const brand = GIFT_CARD_BRANDS.find((b) => b.id === brandId);
    return brand ? `${brand.label} Gift Card` : method.replace(/_/g, " ");
  }

  const crypto = CRYPTO_ASSETS.find((c) => c.id === method);
  if (crypto) return `${crypto.label} (${crypto.symbol})`;

  return method.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function isGiftCardDeposit(method: string) {
  return method.startsWith("gift_card_");
}

export function isCryptoDeposit(method: string) {
  return CRYPTO_ASSETS.some((c) => c.id === method);
}

export type AdminDeposit = Deposit & {
  profiles?: { email: string; full_name: string | null } | null;
};
