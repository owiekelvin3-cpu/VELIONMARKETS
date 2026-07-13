import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BRAND } from "@/constants/brand";
import { Logo } from "@/components/brand/Logo";
import { FadeIn } from "@/components/motion/Motion";
import { Container } from "@/components/ui/section";
import { Shield, Lock, Award, Mail } from "@/lib/icons";

const partners = ["Bloomberg", "Reuters", "ICE", "CME Group", "S&P Global"];

export function Footer() {
  const { t } = useTranslation();

  const footerSections = [
    {
      titleKey: "footer.platform",
      links: [
        { href: "/#markets", labelKey: "nav.markets" },
        { href: "/world-economy", labelKey: "footer.economy" },
        { href: "/forex-news", labelKey: "footer.forexNews" },
        { href: "/brokers", labelKey: "footer.brokers" },
        { href: "/services", labelKey: "nav.services" },
        { href: "/trading-signals", labelKey: "footer.tradingSignals" },
        { href: "/trading-room", labelKey: "footer.tradingRoom" },
      ],
    },
    {
      titleKey: "footer.company",
      links: [
        { href: "/about", labelKey: "footer.aboutUs" },
        { href: "/reviews", labelKey: "footer.testimonials" },
        { href: "/payouts", labelKey: "footer.payouts" },
        { href: "/faqs", labelKey: "footer.faq" },
      ],
    },
    {
      titleKey: "footer.trust",
      links: [
        { href: "/security", labelKey: "nav.security" },
        { href: "/holdings", labelKey: "footer.holdings" },
        { href: "/verify", labelKey: "footer.verifyCertificate" },
      ],
    },
    {
      titleKey: "footer.legal",
      links: [
        { href: "/privacy", labelKey: "footer.privacy" },
        { href: "/terms", labelKey: "footer.terms" },
        { href: "/cookies", labelKey: "footer.cookies" },
      ],
    },
  ] as const;

  const mobileLegal = [
    { href: "/privacy", labelKey: "footer.privacy" },
    { href: "/terms", labelKey: "footer.terms" },
    { href: "/security", labelKey: "nav.security" },
    { href: "/faqs", labelKey: "footer.faq" },
  ] as const;

  const trustIcons = [
    { icon: Shield, labelKey: "common.regulated" },
    { icon: Lock, labelKey: "common.encrypted" },
    { icon: Award, labelKey: "common.certified" },
  ] as const;

  return (
    <footer className="relative mt-12 border-t border-border bg-gradient-to-b from-charcoal/80 to-void pt-12 pb-[max(2rem,env(safe-area-inset-bottom))] sm:mt-20 sm:pt-24 sm:pb-12">
      <div className="absolute inset-x-0 top-0 divider-gradient" aria-hidden="true" />
      <Container>
        <FadeIn className="mb-10 hidden text-center sm:mb-20 sm:block">
          <p className="mb-8 text-xs font-semibold uppercase tracking-[0.25em] text-muted">
            {t("footer.trustedBy")}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
            {partners.map((p) => (
              <span
                key={p}
                className="font-display text-sm font-semibold tracking-widest text-foreground/30 transition-colors hover:text-foreground/50"
              >
                {p}
              </span>
            ))}
          </div>
        </FadeIn>

        <div className="grid gap-8 sm:gap-12 sm:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <Link to="/" className="group inline-flex transition-opacity hover:opacity-90">
              <Logo size="lg" wordmarkClassName="text-lg" />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted sm:mt-5">{BRAND.tagline}</p>
            <a
              href={`mailto:${BRAND.supportEmail}`}
              className="mt-4 inline-flex items-center gap-2 text-sm text-emerald transition-opacity hover:opacity-80 sm:mt-5"
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
              {BRAND.supportEmail}
            </a>
            <div className="mt-6 flex gap-3 sm:mt-8">
              {trustIcons.map(({ icon: Icon, labelKey }) => (
                <div
                  key={labelKey}
                  className="flex h-11 w-11 items-center justify-center rounded-xl glass text-emerald"
                  title={t(labelKey)}
                  aria-label={t(labelKey)}
                >
                  <Icon className="h-4 w-4" />
                </div>
              ))}
            </div>

            {/* Compact legal row on mobile — no link-column menus */}
            <nav
              className="mt-6 flex flex-wrap gap-x-4 gap-y-2 sm:hidden"
              aria-label={t("footer.legal")}
            >
              {mobileLegal.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="text-xs font-medium text-muted hover:text-emerald"
                >
                  {t(link.labelKey)}
                </Link>
              ))}
            </nav>
          </div>

          {/* Full footer menus — tablet/desktop only */}
          {footerSections.map((section) => (
            <div key={section.titleKey} className="hidden sm:block">
              <h4 className="mb-5 font-display text-xs font-semibold uppercase tracking-[0.15em] text-muted">
                {t(section.titleKey)}
              </h4>
              <ul className="space-y-3.5">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="text-sm text-muted transition-colors duration-200 hover:text-emerald"
                    >
                      {t(link.labelKey)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border pt-8 sm:mt-20 sm:gap-4 sm:pt-10 md:flex-row">
          <p className="text-center text-xs text-muted md:text-left">
            &copy; {BRAND.foundedYear}&ndash;{new Date().getFullYear()} {BRAND.legalEntity}. {t("common.allRightsReserved")}
          </p>
          <p className="text-center text-xs text-muted md:text-right">
            {t("common.registration")} {BRAND.registrationNumber} &middot; {t("common.segregatedAccounts")}
          </p>
        </div>
      </Container>
    </footer>
  );
}
