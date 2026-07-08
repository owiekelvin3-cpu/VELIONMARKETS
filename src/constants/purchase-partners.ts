/**
 * External partner sites for users who need to buy crypto or gift cards
 * before depositing on VELION MARKETS. Update these URLs to your preferred vendors.
 */
export interface PurchasePartner {
  id: string;
  name: string;
  /** Admin-editable description (takes priority over descriptionKey) */
  description?: string;
  descriptionKey?: string;
  url: string;
  /** Accent color for the partner card */
  color: string;
  /** Optional logo image URL */
  logoUrl?: string;
  /** Admin-editable tag label */
  tag?: string;
  /** Short tag shown on the card, e.g. "deposits.partnerRecommended" */
  tagKey?: string;
  /** Hide partner when false */
  enabled?: boolean;
}

export const CRYPTO_PURCHASE_PARTNERS: PurchasePartner[] = [
  {
    id: "moonpay",
    name: "MoonPay",
    descriptionKey: "deposits.partnerMoonPayDesc",
    url: "https://www.moonpay.com/buy",
    color: "#7B3FE4",
    tagKey: "deposits.partnerRecommended",
  },
  {
    id: "transak",
    name: "Transak",
    descriptionKey: "deposits.partnerTransakDesc",
    url: "https://global.transak.com",
    color: "#0052FF",
  },
];

export const GIFT_CARD_PURCHASE_PARTNERS: PurchasePartner[] = [
  {
    id: "raise",
    name: "Raise",
    descriptionKey: "deposits.partnerRaiseDesc",
    url: "https://www.raise.com",
    color: "#E31837",
    tagKey: "deposits.partnerRecommended",
  },
  {
    id: "gyft",
    name: "Gyft",
    descriptionKey: "deposits.partnerGyftDesc",
    url: "https://www.gyft.com",
    color: "#00A4E4",
  },
];
