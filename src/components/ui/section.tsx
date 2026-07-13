import { cn } from "@/lib/utils";
import { FadeIn } from "@/components/motion/Motion";

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  variant?: "default" | "elevated" | "gradient";
  style?: React.CSSProperties;
}

export function Section({ children, className, id, variant = "default", style }: SectionProps) {
  return (
    <section
      id={id}
      style={style}
      className={cn(
        "section-padding relative overflow-hidden",
        variant === "elevated" && "bg-gradient-surface",
        variant === "gradient" && "bg-gradient-hero",
        className
      )}
    >
      {children}
    </section>
  );
}

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
  className?: string;
}

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = "center",
  className,
}: SectionHeaderProps) {
  return (
    <FadeIn
      className={cn(
        "mb-16 md:mb-20",
        align === "center" && "mx-auto max-w-3xl text-center",
        align === "left" && "max-w-2xl",
        className
      )}
    >
      {eyebrow && (
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-emerald">
          {eyebrow}
        </p>
      )}
      <h2 className="font-display text-3xl font-bold tracking-tight text-gradient sm:text-4xl md:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-5 text-base leading-relaxed text-muted md:text-lg md:leading-relaxed">
          {subtitle}
        </p>
      )}
      <div className={cn("divider-gradient mt-8", align === "center" ? "mx-auto w-24" : "w-24")} />
    </FadeIn>
  );
}

export function Container({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("container-premium", className)}>{children}</div>;
}
