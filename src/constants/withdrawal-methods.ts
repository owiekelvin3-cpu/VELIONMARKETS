import type { IconComponent } from "@/lib/icons";
import { Paypal } from "@/lib/icons";

export interface EwalletProvider {
  id: string;
  label: string;
  color: string;
  iconUrl?: string;
  Icon?: IconComponent;
  initial?: string;
}

export const EWALLET_PROVIDERS: EwalletProvider[] = [
  {
    id: "paypal",
    label: "PayPal",
    color: "#003087",
    iconUrl: "https://cdn.simpleicons.org/paypal/white",
    Icon: Paypal,
  },
  {
    id: "wise",
    label: "Wise",
    color: "#163300",
    iconUrl: "https://cdn.simpleicons.org/wise/9FE870",
    initial: "W",
  },
  {
    id: "skrill",
    label: "Skrill",
    color: "#872166",
    iconUrl: "https://cdn.simpleicons.org/skrill/white",
    initial: "S",
  },
  {
    id: "neteller",
    label: "Neteller",
    color: "#83BA3B",
    initial: "N",
  },
  {
    id: "revolut",
    label: "Revolut",
    color: "#191C1F",
    iconUrl: "https://cdn.simpleicons.org/revolut/white",
    initial: "R",
  },
];

export type WithdrawMethodId = "crypto" | "bank" | "wire" | "ewallet";

export const WITHDRAW_METHODS: Array<{
  id: WithdrawMethodId;
  href: string;
  timingKey: string;
  titleKey: string;
  descKey: string;
}> = [
  {
    id: "crypto",
    href: "/dashboard/withdrawals/crypto",
    timingKey: "withdrawals.cryptoTiming",
    titleKey: "withdrawals.cryptoTitle",
    descKey: "withdrawals.cryptoDesc",
  },
  {
    id: "bank",
    href: "/dashboard/withdrawals/bank",
    timingKey: "withdrawals.bankTiming",
    titleKey: "withdrawals.bankTitle",
    descKey: "withdrawals.bankDesc",
  },
  {
    id: "wire",
    href: "/dashboard/withdrawals/wire",
    timingKey: "withdrawals.wireTiming",
    titleKey: "withdrawals.wireTitle",
    descKey: "withdrawals.wireDesc",
  },
  {
    id: "ewallet",
    href: "/dashboard/withdrawals/ewallet",
    timingKey: "withdrawals.ewalletTiming",
    titleKey: "withdrawals.ewalletTitle",
    descKey: "withdrawals.ewalletDesc",
  },
];
