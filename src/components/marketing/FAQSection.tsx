import { useTranslation } from "react-i18next";
import { FadeIn } from "@/components/motion/Motion";
import { Section, SectionHeader, Container } from "@/components/ui/section";
import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown } from "@/lib/icons";

const faqKeys = [
  { qKey: "faq.q1", aKey: "faq.a1" },
  { qKey: "faq.q2", aKey: "faq.a2" },
  { qKey: "faq.q3", aKey: "faq.a3" },
  { qKey: "faq.q4", aKey: "faq.a4" },
  { qKey: "faq.q5", aKey: "faq.a5" },
] as const;

export function FAQSection() {
  const { t } = useTranslation();

  return (
    <Section variant="gradient" className="!pb-32">
      <Container>
        <SectionHeader eyebrow={t("faq.eyebrow")} title={t("faq.title")} />
        <FadeIn className="mx-auto max-w-3xl">
          <Accordion.Root type="single" collapsible className="space-y-4">
            {faqKeys.map((faq, i) => (
              <Accordion.Item
                key={faq.qKey}
                value={`item-${i}`}
                className="card-elevated overflow-hidden rounded-2xl px-6 md:px-8 data-[state=open]:border-emerald/25"
              >
                <Accordion.Header>
                  <Accordion.Trigger className="group flex w-full items-center justify-between gap-4 py-6 text-left font-display text-base font-medium text-foreground transition-colors hover:text-emerald md:text-lg">
                    {t(faq.qKey)}
                    <ChevronDown className="h-5 w-5 shrink-0 text-muted transition-transform duration-300 group-data-[state=open]:rotate-180" aria-hidden="true" />
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                  <p className="pb-6 text-sm leading-relaxed text-muted md:text-base">{t(faq.aKey)}</p>
                </Accordion.Content>
              </Accordion.Item>
            ))}
          </Accordion.Root>
        </FadeIn>
      </Container>
    </Section>
  );
}
