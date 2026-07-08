import type { IconComponent } from "@/lib/icons";
import { Paypal, Wallet } from "@/lib/icons";

export interface EwalletProvider {
  id: string;
  label: string;
  color: string;
  Icon?: IconComponent;
  initial?: string;
}

export const EWALLET_PROVIDERS: EwalletProvider[] = [
  { id: "paypal", label: "PayPal", color: "#003087", Icon: Paypal },
  { id: "wise", label: "Wise", color: "#9FE870", Icon: Wallet },
  { id: "skrill", label: "Skrill", color: "#872166", initial: "S" },
  { id: "neteller", label: "Neteller", color: "#83BA3B", initial: "N" },
  { id: "revolut", label: "Revolut", color: "#191C1F", Icon: Wallet },
];
