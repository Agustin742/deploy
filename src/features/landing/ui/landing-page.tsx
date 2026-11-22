import { FaqSection } from "./faq-section";
import { HeroSection } from "./hero-section";
import { FinalCta, LandingFooter } from "./landing-footer";
import { LandingHeader } from "./landing-header";
import { PricingSection } from "./pricing-section";
import { ProductSection, ValueStrip } from "./value-sections";

export function LandingPage() {
  return (
    <>
      <LandingHeader />
      <main>
        <HeroSection />
        <ValueStrip />
        <ProductSection />
        <PricingSection />
        <FaqSection />
        <FinalCta />
      </main>
      <LandingFooter />
    </>
  );
}
