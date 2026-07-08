import { cn } from "@/lib/utils";
import {
  DEPOSIT_CRYPTO_PREVIEW,
  DEPOSIT_GIFT_CARD_PREVIEW,
  type CryptoAsset,
  type GiftCardBrand,
} from "@/constants/deposit-assets";

type LogoSize = "xs" | "sm" | "md" | "lg" | "xl";

const LOGO_SIZE: Record<LogoSize, string> = {
  xs: "h-5 w-5",
  sm: "h-6 w-6",
  md: "h-8 w-8",
  lg: "h-10 w-10",
  xl: "h-12 w-12",
};

const TILE_SIZE: Record<LogoSize, string> = {
  xs: "h-8 w-8",
  sm: "h-9 w-9",
  md: "h-11 w-11",
  lg: "h-14 w-14",
  xl: "h-16 w-16",
};

interface BrandLogoProps {
  src: string;
  alt: string;
  size?: LogoSize;
  tile?: boolean;
  tileClassName?: string;
  className?: string;
  selected?: boolean;
}

export function BrandLogo({
  src,
  alt,
  size = "md",
  tile = true,
  tileClassName,
  className,
  selected,
}: BrandLogoProps) {
  const image = (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      className={cn(LOGO_SIZE[size], "object-contain", className)}
    />
  );

  if (!tile) return image;

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-black/5",
        TILE_SIZE[size],
        selected && "ring-2 ring-emerald/50 ring-offset-2 ring-offset-background",
        tileClassName
      )}
      aria-hidden={alt === ""}
    >
      {image}
    </div>
  );
}

function CryptoTile({ asset, compact }: { asset: CryptoAsset; compact?: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-xl bg-white p-1",
        compact ? "aspect-square" : "h-full w-full"
      )}
      aria-hidden="true"
    >
      <img
        src={asset.iconUrl}
        alt=""
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        className={cn("object-contain", compact ? "h-7 w-7" : "h-8 w-8")}
      />
    </div>
  );
}

function GiftCardTile({ brand, compact }: { brand: GiftCardBrand; compact?: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-xl bg-white p-1",
        compact ? "aspect-square" : "h-full w-full"
      )}
      aria-hidden="true"
    >
      <img
        src={brand.iconUrl}
        alt=""
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        className={cn("object-contain", compact ? "h-6 w-6" : "h-7 w-7")}
      />
    </div>
  );
}

export function CryptoIconGrid({ size = "lg" }: { size?: "lg" | "sm" }) {
  const icons = DEPOSIT_CRYPTO_PREVIEW;

  if (size === "sm") {
    return (
      <div className="flex flex-wrap gap-2">
        {icons.map((asset) => (
          <BrandLogo key={asset.id} src={asset.iconUrl} alt={asset.label} size="xs" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid h-[80px] w-[80px] shrink-0 grid-cols-2 gap-1.5 rounded-2xl bg-white/[0.97] p-2 shadow-md ring-1 ring-black/5">
      {icons.slice(0, 4).map((asset) => (
        <CryptoTile key={asset.id} asset={asset} compact />
      ))}
    </div>
  );
}

export function GiftCardIconGrid({ size = "lg" }: { size?: "lg" | "sm" }) {
  const icons = DEPOSIT_GIFT_CARD_PREVIEW;

  if (size === "sm") {
    return (
      <div className="flex flex-wrap gap-2">
        {icons.map((brand) => (
          <BrandLogo key={brand.id} src={brand.iconUrl} alt={brand.label} size="xs" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid h-[80px] w-[80px] shrink-0 grid-cols-2 gap-1.5 rounded-2xl bg-white/[0.97] p-2 shadow-md ring-1 ring-black/5">
      {icons.slice(0, 4).map((brand) => (
        <GiftCardTile key={brand.id} brand={brand} compact />
      ))}
    </div>
  );
}

export function CryptoBrandIcon({
  asset,
  selected,
}: {
  asset: CryptoAsset;
  selected?: boolean;
}) {
  return (
    <div className="mx-auto mb-2">
      <BrandLogo
        src={asset.iconUrl}
        alt={asset.label}
        size="lg"
        selected={selected}
      />
    </div>
  );
}

export function GiftCardBrandIcon({
  brand,
  selected,
}: {
  brand: GiftCardBrand;
  selected?: boolean;
}) {
  return (
    <div className="mx-auto mb-2">
      <BrandLogo
        src={brand.iconUrl}
        alt={brand.label}
        size="lg"
        selected={selected}
      />
    </div>
  );
}
