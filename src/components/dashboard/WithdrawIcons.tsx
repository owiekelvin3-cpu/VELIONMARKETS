import {
  Building2, Coins, CreditCard, Globe2, Landmark, Wallet,
} from "@/lib/icons";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/dashboard/DepositIcons";
import { EWALLET_PROVIDERS, type EwalletProvider, type WithdrawMethodId } from "@/constants/withdrawal-methods";
import { CRYPTO_ASSETS } from "@/constants/deposit-assets";

export { CryptoIconGrid } from "@/components/dashboard/DepositIcons";

const METHOD_STYLES: Record<WithdrawMethodId, {
  gradient: string;
  ring: string;
  iconBg: string;
  text: string;
  shadow: string;
}> = {
  crypto: {
    gradient: "from-emerald/20 via-emerald/5 to-transparent",
    ring: "group-hover:border-emerald/40 group-hover:shadow-[0_8px_32px_rgba(16,185,129,0.12)]",
    iconBg: "bg-gradient-to-br from-emerald to-emerald/70 text-white shadow-lg shadow-emerald/25",
    text: "text-emerald",
    shadow: "shadow-emerald/20",
  },
  bank: {
    gradient: "from-blue-500/15 via-blue-500/5 to-transparent",
    ring: "group-hover:border-blue-500/35 group-hover:shadow-[0_8px_32px_rgba(59,130,246,0.12)]",
    iconBg: "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25",
    text: "text-blue-400",
    shadow: "shadow-blue-500/20",
  },
  wire: {
    gradient: "from-indigo-500/15 via-indigo-500/5 to-transparent",
    ring: "group-hover:border-indigo-500/35 group-hover:shadow-[0_8px_32px_rgba(99,102,241,0.12)]",
    iconBg: "bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25",
    text: "text-indigo-400",
    shadow: "shadow-indigo-500/20",
  },
  ewallet: {
    gradient: "from-amber-500/15 via-amber-500/5 to-transparent",
    ring: "group-hover:border-amber-500/35 group-hover:shadow-[0_8px_32px_rgba(245,158,11,0.12)]",
    iconBg: "bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25",
    text: "text-amber-400",
    shadow: "shadow-amber-500/20",
  },
};

function MethodGlyph({ method }: { method: WithdrawMethodId }) {
  const cls = "h-6 w-6";
  switch (method) {
    case "crypto": return <Coins className={cls} />;
    case "bank": return <Building2 className={cls} />;
    case "wire": return <Globe2 className={cls} />;
    case "ewallet": return <Wallet className={cls} />;
  }
}

export function WithdrawMethodIcon({
  method,
  size = "lg",
}: {
  method: WithdrawMethodId;
  size?: "sm" | "lg";
}) {
  const s = METHOD_STYLES[method];
  const dim = size === "lg" ? "h-14 w-14 rounded-2xl" : "h-10 w-10 rounded-xl";

  return (
    <div className={cn("flex shrink-0 items-center justify-center", dim, s.iconBg)}>
      <MethodGlyph method={method} />
    </div>
  );
}

export function WithdrawMethodPreview({ method }: { method: WithdrawMethodId }) {
  const s = METHOD_STYLES[method];

  if (method === "crypto") {
    return (
      <div className="flex -space-x-2">
        {CRYPTO_ASSETS.slice(0, 4).map((asset) => (
          <BrandLogo key={asset.id} src={asset.iconUrl} alt={asset.label} size="sm" tileClassName="ring-2 ring-card" />
        ))}
      </div>
    );
  }

  if (method === "ewallet") {
    return (
      <div className="flex -space-x-1.5">
        {EWALLET_PROVIDERS.slice(0, 4).map((p) => (
          <EwalletProviderIcon key={p.id} provider={p} size="sm" />
        ))}
      </div>
    );
  }

  if (method === "bank") {
    return (
      <div className="flex gap-1.5">
        {[Building2, CreditCard, Landmark].map((Icon, i) => (
          <div key={i} className={cn("flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/15", s.text)}>
            <Icon className="h-3.5 w-3.5" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-1.5">
      {[Globe2, Landmark, Wallet].map((Icon, i) => (
        <div key={i} className={cn("flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/15", s.text)}>
          <Icon className="h-3.5 w-3.5" />
        </div>
      ))}
    </div>
  );
}

export function getMethodStyles(method: WithdrawMethodId) {
  return METHOD_STYLES[method];
}

export function EwalletProviderIcon({
  provider,
  selected,
  size = "md",
}: {
  provider: EwalletProvider;
  selected?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const Icon = provider.Icon;
  const dim = size === "sm" ? "h-8 w-8" : size === "lg" ? "h-14 w-14" : "h-11 w-11";
  const iconDim = size === "sm" ? "h-3.5 w-3.5" : size === "lg" ? "h-6 w-6" : "h-5 w-5";

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full shadow-md ring-1 ring-black/10",
        dim,
        selected && "ring-2 ring-emerald ring-offset-2 ring-offset-background"
      )}
      style={{ backgroundColor: provider.color }}
    >
      {provider.iconUrl ? (
        <img
          src={provider.iconUrl}
          alt={provider.label}
          className={cn(iconDim, "object-contain")}
          loading="lazy"
        />
      ) : Icon ? (
        <Icon className={cn(iconDim, "text-white")} />
      ) : (
        <span className={cn("font-bold text-white", size === "sm" ? "text-xs" : "text-sm")}>
          {provider.initial}
        </span>
      )}
    </div>
  );
}

/** @deprecated use WithdrawMethodIcon */
export function BankWithdrawIcon({ size = "lg" }: { size?: "lg" | "sm" }) {
  return <WithdrawMethodIcon method="bank" size={size === "sm" ? "sm" : "lg"} />;
}

/** @deprecated use WithdrawMethodIcon */
export function WireWithdrawIcon({ size = "lg" }: { size?: "lg" | "sm" }) {
  return <WithdrawMethodIcon method="wire" size={size === "sm" ? "sm" : "lg"} />;
}

/** @deprecated use WithdrawMethodPreview */
export function EwalletIconGrid() {
  return <WithdrawMethodPreview method="ewallet" />;
}
