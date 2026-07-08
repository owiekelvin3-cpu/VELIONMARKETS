import { FadeIn } from "@/components/motion/Motion";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <FadeIn className="mb-10 md:mb-12">
      <h2 className="font-display text-2xl font-bold tracking-tight text-gradient md:text-3xl lg:text-4xl">{title}</h2>
      {subtitle && <p className="mt-3 max-w-2xl text-base text-muted">{subtitle}</p>}
      <div className="divider-gradient mt-6 w-16" />
    </FadeIn>
  );
}
