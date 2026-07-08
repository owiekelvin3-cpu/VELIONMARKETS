import type { ReactNode } from "react";
import { BRAND } from "@/constants/brand";
import { PageHero } from "@/components/marketing/PageHero";
import { FadeIn } from "@/components/motion/Motion";
import { GlassCard } from "@/components/ui/glass-card";

function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <PageHero badge="Legal" title={title} />
      <section className="pb-24">
        <div className="container mx-auto px-4">
          <FadeIn className="mx-auto max-w-3xl">
            <GlassCard className="prose prose-invert max-w-none">
              <div className="space-y-6 text-muted leading-relaxed [&_h2]:text-foreground [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-8 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2">
                {children}
              </div>
              <p className="mt-10 text-sm text-muted border-t border-white/5 pt-6">
                Last updated: July 2026. Contact{" "}
                <a href={`mailto:${BRAND.complianceEmail}`} className="text-emerald hover:underline">{BRAND.complianceEmail}</a>
              </p>
            </GlassCard>
          </FadeIn>
        </div>
      </section>
    </>
  );
}

export function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <p>{BRAND.legalEntity} is committed to protecting your privacy. This policy explains how we collect, use, and safeguard your personal information.</p>
      <h2>Information We Collect</h2>
      <p>We collect information you provide directly, including name, email, identity documents for KYC, and financial transaction data.</p>
      <h2>How We Use Your Information</h2>
      <p>Your information is used to provide services, comply with legal obligations, process transactions, and communicate with you.</p>
      <h2>Data Security</h2>
      <p>We implement TLS 1.3 encryption, AES-256 at rest, and regular security audits.</p>
      <h2>Your Rights</h2>
      <p>Under GDPR, you have the right to access, correct, delete, or port your personal data.</p>
    </LegalPage>
  );
}

export function TermsPage() {
  return (
    <LegalPage title="Terms of Service">
      <p>By using {BRAND.name}, you agree to these Terms of Service.</p>
      <h2>Account Registration</h2>
      <p>You must provide accurate information and complete KYC before accessing investment services.</p>
      <h2>Investment Risks</h2>
      <p>All investments carry risk, including potential loss of principal. Past performance does not guarantee future results.</p>
      <h2>Fees</h2>
      <p>Applicable fees are disclosed in your plan details. We reserve the right to modify fees with 30 days notice.</p>
    </LegalPage>
  );
}

export function CookiesPage() {
  return (
    <LegalPage title="Cookie Policy">
      <p>This policy explains how {BRAND.name} uses cookies and similar technologies.</p>
      <h2>What Are Cookies</h2>
      <p>Cookies are small text files that help us provide and improve our services.</p>
      <h2>Types of Cookies</h2>
      <ul>
        <li><strong>Essential:</strong> Required for authentication and security.</li>
        <li><strong>Analytics:</strong> Help us understand site usage.</li>
        <li><strong>Preferences:</strong> Remember your settings.</li>
      </ul>
    </LegalPage>
  );
}
