import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FadeIn } from "@/components/motion/Motion";
import { Container } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Clean TradingView-style page header — brand title, short subtitle, optional CTA. */
export function PageHero({
  badge,
  title,
  subtitle,
  children,
  align = "left",
  cta,
  image: _image,
}: {
  badge?: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  align?: "left" | "center";
  cta?: { label: string; href: string };
  /** Kept for compatibility — unused in the clean TV-style hero */
  image?: string;
}) {
  void _image;
  return (
    <section className="relative overflow-hidden border-b border-border/60 pb-10 pt-8 md:pb-14 md:pt-12">
      <Container>
        <FadeIn
          className={cn(
            "max-w-3xl",
            align === "center" && "mx-auto text-center"
          )}
        >
          {badge && (
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-emerald">
              {badge}
            </p>
          )}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="font-display text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-[3.25rem] md:leading-[1.08]"
          >
            {title}
          </motion.h1>
          {subtitle && (
            <p className={cn("mt-4 max-w-2xl text-base text-muted md:text-lg", align === "center" && "mx-auto")}>
              {subtitle}
            </p>
          )}
          {cta && (
            <div className={cn("mt-7", align === "center" && "flex justify-center")}>
              <Button asChild size="lg">
                <Link to={cta.href}>{cta.label}</Link>
              </Button>
            </div>
          )}
          {children && <div className="mt-8">{children}</div>}
        </FadeIn>
      </Container>
    </section>
  );
}
