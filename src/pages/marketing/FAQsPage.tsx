import { useTranslation } from "react-i18next";
import { FAQSection } from "@/components/marketing/FAQSection";
import { PageHero } from "@/components/marketing/PageHero";

export default function FAQsPage() {
  const { t } = useTranslation();

  return (
    <>
      <PageHero
        badge={t("pages.faqsBadge")}
        title={t("pages.faqsTitle")}
        subtitle={t("pages.faqsSubtitle")}
      />
      <FAQSection />
    </>
  );
}
