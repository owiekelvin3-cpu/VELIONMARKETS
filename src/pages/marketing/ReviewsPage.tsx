import { useTranslation } from "react-i18next";
import { TestimonialsSection } from "@/components/marketing/TestimonialsSection";
import { PageHero } from "@/components/marketing/PageHero";
import { IMAGES } from "@/constants/images";

export default function ReviewsPage() {
  const { t } = useTranslation();

  return (
    <>
      <PageHero
        badge={t("pages.reviewsBadge")}
        title={t("pages.reviewsTitle")}
        subtitle={t("pages.reviewsSubtitle")}
        image={IMAGES.about.meeting}
      />
      <TestimonialsSection />
    </>
  );
}
