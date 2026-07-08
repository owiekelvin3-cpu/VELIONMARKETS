import { Building2, CreditCard, Globe2, Landmark, Wallet } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { CryptoIconGrid } from "@/components/dashboard/DepositIcons";
import { EWALLET_PROVIDERS } from "@/constants/withdrawal-methods";

export { CryptoIconGrid };

function IconGridShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid h-[80px] w-[80px] shrink-0 grid-cols-2 gap-1.5 rounded-2xl bg-white/[0.97] p-2 shadow-md ring-1 ring-black/5">
      {children}
    </div>
  );
}

function GridCell({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={cn("flex items-center justify-center rounded-lg", className)}
      style={style}
      aria-hidden="true"
    >
      {children}
    </div>
  );
}

export function BankWithdrawIcon({ size = "lg" }: { size?: "lg" | "sm" }) {
  if (size === "sm") {
    return (
      <div className="flex gap-1.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500/20 text-blue-400">
          <Building2 className="h-3.5 w-3.5" />
        </div>
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500/20 text-blue-400">
          <CreditCard className="h-3.5 w-3.5" />
        </div>
      </div>
    );
  }

  return (
    <IconGridShell>
      <GridCell className="bg-blue-500/15 text-blue-500">
        <Building2 className="h-4 w-4" />
      </GridCell>
      <GridCell className="bg-blue-500/10 text-blue-400">
        <Landmark className="h-4 w-4" />
      </GridCell>
      <GridCell className="bg-blue-500/10 text-blue-400">
        <CreditCard className="h-4 w-4" />
      </GridCell>
      <GridCell className="bg-blue-500/15 text-blue-500">
        <Wallet className="h-4 w-4" />
      </GridCell>
    </IconGridShell>
  );
}

export function WireWithdrawIcon({ size = "lg" }: { size?: "lg" | "sm" }) {
  if (size === "sm") {
    return (
      <div className="flex gap-1.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400">
          <Globe2 className="h-3.5 w-3.5" />
        </div>
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400">
          <Landmark className="h-3.5 w-3.5" />
        </div>
      </div>
    );
  }

  return (
    <IconGridShell>
      <GridCell className="bg-indigo-500/15 text-indigo-400">
        <Globe2 className="h-4 w-4" />
      </GridCell>
      <GridCell className="bg-indigo-500/10 text-indigo-300">
        <Landmark className="h-4 w-4" />
      </GridCell>
      <GridCell className="bg-indigo-500/10 text-indigo-300">
        <Building2 className="h-4 w-4" />
      </GridCell>
      <GridCell className="bg-indigo-500/15 text-indigo-400">
        <Wallet className="h-4 w-4" />
      </GridCell>
    </IconGridShell>
  );
}

export function EwalletIconGrid({ size = "lg" }: { size?: "lg" | "sm" }) {
  const providers = EWALLET_PROVIDERS.slice(0, 4);

  if (size === "sm") {
    return (
      <div className="flex flex-wrap gap-1.5">
        {EWALLET_PROVIDERS.map((p) => (
          <div
            key={p.id}
            className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white"
            style={{ backgroundColor: p.color }}
          >
            {p.Icon ? <p.Icon className="h-3.5 w-3.5" /> : p.initial}
          </div>
        ))}
      </div>
    );
  }

  return (
    <IconGridShell>
      {providers.map((p) => (
        <GridCell key={p.id} style={{ backgroundColor: p.color }} className="text-white">
          {p.Icon ? <p.Icon className="h-4 w-4" /> : (
            <span className="text-[10px] font-bold">{p.initial}</span>
          )}
        </GridCell>
      ))}
    </IconGridShell>
  );
}

export function EwalletProviderIcon({
  provider,
  selected,
}: {
  provider: (typeof EWALLET_PROVIDERS)[0];
  selected?: boolean;
}) {
  const Icon = provider.Icon;
  return (
    <div
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-full text-white",
        selected && "ring-2 ring-emerald/50 ring-offset-2 ring-offset-background"
      )}
      style={{ backgroundColor: provider.color }}
    >
      {Icon ? <Icon className="h-5 w-5" /> : (
        <span className="text-sm font-bold">{provider.initial}</span>
      )}
    </div>
  );
}
