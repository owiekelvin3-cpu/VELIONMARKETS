import { MarketTicker } from "@/components/marketing/MarketTicker";
import { Hero } from "@/components/marketing/Hero";
import { TrustBar } from "@/components/marketing/TrustBar";
import { EditorialSection } from "@/components/marketing/EditorialSection";
import { ServicesGrid } from "@/components/marketing/ServicesGrid";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { TestimonialsSection } from "@/components/marketing/TestimonialsSection";
import { SecuritySection } from "@/components/marketing/SecuritySection";
import { FAQSection } from "@/components/marketing/FAQSection";

export default function HomePage() {
  return (
    <>
      <Hero />
      <MarketTicker />
      <TrustBar />
      <EditorialSection />
      <ServicesGrid />
      <HowItWorks />
      <TestimonialsSection />
      <SecuritySection />
      <FAQSection />
    </>
  );
}
