import { motion } from "framer-motion";
import { FadeIn } from "@/components/motion/Motion";
import { Container } from "@/components/ui/section";

export function PageHero({
  badge,
  title,
  subtitle,
  image,
  children,
}: {
  badge?: string;
  title: string;
  subtitle?: string;
  image?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden pb-20 pt-4 md:pb-28 md:pt-8">
      {image && (
        <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
          <img src={image} alt="" className="h-full w-full object-cover opacity-[0.12]" loading="eager" />
          <div className="absolute inset-0 bg-gradient-to-b from-void/20 via-void/90 to-void" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-hero opacity-60 pointer-events-none" aria-hidden="true" />
      <Container>
        <FadeIn className="mx-auto max-w-4xl text-center">
          {badge && (
            <span className="mb-8 inline-block rounded-full border border-emerald/20 bg-gradient-emerald-subtle px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald">
              {badge}
            </span>
          )}
          <motion.h1
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-4xl font-bold tracking-tight text-gradient sm:text-5xl md:text-6xl lg:text-7xl"
          >
            {title}
          </motion.h1>
          {subtitle && (
            <p className="mx-auto mt-7 max-w-2xl text-base leading-relaxed text-muted md:text-xl md:leading-relaxed">
              {subtitle}
            </p>
          )}
          <div className="divider-gradient mx-auto mt-10 w-24" />
          {children && <div className="mt-10">{children}</div>}
        </FadeIn>
      </Container>
    </section>
  );
}
