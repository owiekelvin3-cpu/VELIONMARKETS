import { cn } from "@/lib/utils";

interface PremiumImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  aspect?: "video" | "square" | "portrait" | "wide" | "auto";
  overlay?: boolean;
  hover?: boolean;
}

const aspectClasses = {
  video: "aspect-video",
  square: "aspect-square",
  portrait: "aspect-[3/4]",
  wide: "aspect-[21/9]",
  auto: "",
};

export function PremiumImage({
  src,
  alt,
  className,
  aspect = "video",
  overlay = false,
  hover = true,
  ...props
}: PremiumImageProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-charcoal ring-1 ring-white/10",
        aspect !== "auto" && aspectClasses[aspect],
        hover && "group",
        className
      )}
    >
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={cn(
          "h-full w-full object-cover",
          hover && "transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        )}
        {...props}
      />
      {overlay && (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-void/80 via-void/20 to-transparent" />
      )}
    </div>
  );
}
