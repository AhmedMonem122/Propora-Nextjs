import type { Metadata } from 'next';
import { Hero } from '@/components/marketing/Hero/Hero';
import { FeatureGrid } from '@/components/marketing/FeatureGrid/FeatureGrid';
import { Stats } from '@/components/marketing/Stats/Stats';
import { Testimonials } from '@/components/marketing/Testimonials/Testimonials';
import { PricingTeaser } from '@/components/marketing/PricingTeaser/PricingTeaser';
import { Faq } from '@/components/marketing/Faq/Faq';
import { CtaSection } from '@/components/marketing/CtaSection/CtaSection';

export const metadata: Metadata = {
  title: 'Propora — Better Properties. Happier Communities.',
  description:
    'Propora unifies properties, leases, payments, maintenance and documents in one fast multitenant dashboard for modern property managers.',
};

const ORG_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Propora',
  slogan: 'Better Properties. Happier Communities.',
  url: process.env.NEXT_PUBLIC_APP_URL ?? 'https://propora-nextjs.vercel.app',
};

export default function HomePage(): React.JSX.Element {
  return (
    <>
      {/* Static JSON-LD Organization schema — no user input, the one sanctioned exception. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_JSONLD) }} />
      <Hero />
      <FeatureGrid />
      <Stats />
      <Testimonials />
      <PricingTeaser />
      <Faq />
      <CtaSection />
    </>
  );
}
