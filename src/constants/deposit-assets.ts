const CRYPTO_CDN = "https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/svg/color";

export interface CryptoAsset {
  id: string;
  label: string;
  symbol: string;
  color: string;
  iconUrl: string;
}

export interface GiftCardBrand {
  id: string;
  label: string;
  fullName: string;
  color: string;
  iconUrl: string;
}

export const CRYPTO_ASSETS: CryptoAsset[] = [
  { id: "bitcoin", label: "Bitcoin", symbol: "BTC", color: "#F7931A", iconUrl: `${CRYPTO_CDN}/btc.svg` },
  { id: "ethereum", label: "Ethereum", symbol: "ETH", color: "#627EEA", iconUrl: `${CRYPTO_CDN}/eth.svg` },
  { id: "usdt", label: "Tether", symbol: "USDT", color: "#26A17B", iconUrl: `${CRYPTO_CDN}/usdt.svg` },
  { id: "bnb", label: "BNB", symbol: "BNB", color: "#F3BA2F", iconUrl: `${CRYPTO_CDN}/bnb.svg` },
  { id: "solana", label: "Solana", symbol: "SOL", color: "#9945FF", iconUrl: `${CRYPTO_CDN}/sol.svg` },
  { id: "xrp", label: "Ripple", symbol: "XRP", color: "#23292F", iconUrl: `${CRYPTO_CDN}/xrp.svg` },
  { id: "litecoin", label: "Litecoin", symbol: "LTC", color: "#345D9D", iconUrl: `${CRYPTO_CDN}/ltc.svg` },
  { id: "dogecoin", label: "Dogecoin", symbol: "DOGE", color: "#C2A633", iconUrl: `${CRYPTO_CDN}/doge.svg` },
];

export const GIFT_CARD_BRANDS: GiftCardBrand[] = [
  { id: "apple", label: "Apple", fullName: "Apple / iTunes Gift Card", color: "#000000", iconUrl: "https://cdn.simpleicons.org/apple/000000" },
  { id: "amazon", label: "Amazon", fullName: "Amazon Gift Card", color: "#FF9900", iconUrl: "https://cdn.simpleicons.org/amazon/FF9900" },
  { id: "steam", label: "Steam", fullName: "Steam Wallet Code", color: "#1B2838", iconUrl: "https://cdn.simpleicons.org/steam/1B2838" },
  { id: "google_play", label: "Google Play", fullName: "Google Play Gift Card", color: "#01875F", iconUrl: "https://cdn.simpleicons.org/googleplay/01875F" },
  { id: "visa", label: "Visa", fullName: "Visa Prepaid Card", color: "#1A1F71", iconUrl: "https://cdn.simpleicons.org/visa/1A1F71" },
  { id: "mastercard", label: "Mastercard", fullName: "Mastercard Prepaid Card", color: "#EB001B", iconUrl: "https://cdn.simpleicons.org/mastercard/EB001B" },
];

export const DEPOSIT_CRYPTO_PREVIEW = CRYPTO_ASSETS.slice(0, 6);
export const DEPOSIT_GIFT_CARD_PREVIEW = GIFT_CARD_BRANDS.slice(0, 5);
