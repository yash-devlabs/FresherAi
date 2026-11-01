import { Navbar } from '@/components/landing/navbar';
import { Hero } from '@/components/landing/hero';
import { FeatureBar } from '@/components/landing/feature-bar';
import { AgentPreviewCards } from '@/components/landing/agent-preview-cards';
import { PricingSection, AboutSection } from '@/components/landing/placeholder-sections';

// Public landing page. The existing FresherAI sections remain in the same order.
export function HomePage() {
  return (
    <div className="min-h-screen overflow-x-clip bg-background font-sans text-foreground">
      <Navbar />
      <main><Hero /><FeatureBar /><AgentPreviewCards /><PricingSection /><AboutSection /></main>
    </div>
  );
}
