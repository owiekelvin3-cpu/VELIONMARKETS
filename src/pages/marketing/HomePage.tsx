import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { MarketTicker } from "@/components/marketing/MarketTicker";
import { Hero } from "@/components/marketing/Hero";
import { MarketSummary } from "@/components/marketing/MarketSummary";
import { ProductShowcase } from "@/components/marketing/ProductShowcase";
import { ServicesGrid } from "@/components/marketing/ServicesGrid";
import { InsightsRail } from "@/components/marketing/InsightsRail";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { CommunityPulse } from "@/components/marketing/CommunityPulse";
import { FAQSection } from "@/components/marketing/FAQSection";

export default function HomePage() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash === "#markets") {
      requestAnimationFrame(() => {
        document.getElementById("markets")?.scrollIntoView({ behavior: "smooth" });
      });
    }
  }, [location.hash]);

  return (
    <>
      <Hero />
      <MarketTicker />
      <MarketSummary />
      <ProductShowcase />
      <ServicesGrid />
      <InsightsRail />
      <HowItWorks />
      <CommunityPulse />
      <FAQSection />
    </>
  );
}
