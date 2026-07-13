export type FeeTypeId =
  | "kyc_aml"
  | "wallet_activation"
  | "liquidity"
  | "smart_contract"
  | "anti_fraud"
  | "mining"
  | "custom";

export interface FeeTypeOption {
  id: FeeTypeId;
  label: string;
  i18nKey: string;
}

export const FEE_TYPES: FeeTypeOption[] = [
  { id: "kyc_aml", label: "KYC/AML compliance fee", i18nKey: "fees.types.kyc_aml" },
  { id: "wallet_activation", label: "Wallet activation fee", i18nKey: "fees.types.wallet_activation" },
  { id: "liquidity", label: "Liquidity fee", i18nKey: "fees.types.liquidity" },
  { id: "smart_contract", label: "Smart contract fee", i18nKey: "fees.types.smart_contract" },
  { id: "anti_fraud", label: "Anti-fraud deposit", i18nKey: "fees.types.anti_fraud" },
  { id: "mining", label: "Mining fee", i18nKey: "fees.types.mining" },
  { id: "custom", label: "Custom fee", i18nKey: "fees.types.custom" },
];

export function getFeeTypeLabel(feeType: string, customLabel?: string | null) {
  if (feeType === "custom" && customLabel) return customLabel;
  return FEE_TYPES.find((f) => f.id === feeType)?.label ?? customLabel ?? feeType;
}
