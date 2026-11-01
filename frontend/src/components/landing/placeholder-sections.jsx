import { Check } from 'lucide-react';
const FREE_PLAN = {
    name: 'Free',
    price: '₹0',
    features: [
        'All four AI agents',
        'Resume analysis and ATS scoring',
        'Personalized learning roadmap',
        'Unlimited mock interviews',
        'Placement readiness reports',
    ],
};
export function PricingSection() {
    return (<section id="pricing" className="mx-auto w-full max-w-7xl scroll-mt-24 px-5 py-20 sm:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-gold">
          Pricing
        </span>
        <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          Free while you prepare
        </h2>
        <p className="mt-4 text-muted-foreground leading-relaxed">
          Every FresherAI agent is available at no cost. No card, no hidden fees.
        </p>
      </div>

      <div className="mx-auto mt-12 max-w-md">
        <div className="flex flex-col rounded-3xl border border-foreground/30 bg-card p-7 shadow-2xl">
          <span className="font-display text-lg font-semibold">
            {FREE_PLAN.name}
          </span>
          <span className="mt-3 font-display text-4xl font-bold">
            {FREE_PLAN.price}
          </span>
          <ul className="mt-6 flex flex-col gap-3">
            {FREE_PLAN.features.map((feature) => (<li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="h-4 w-4 shrink-0 text-gold"/>
                {feature}
              </li>))}
          </ul>
        </div>
      </div>
    </section>);
}
export function AboutSection() {
    return (<section id="about" className="mx-auto w-full max-w-7xl scroll-mt-24 px-5 pb-24 sm:px-8">
      <div className="rounded-3xl border border-border bg-card/60 px-6 py-14 text-center sm:px-16">
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-gold">
          About
        </span>
        <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          Built to make every fresher placement ready
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-muted-foreground leading-relaxed">
          FresherAI combines four specialized AI agents — Interview, Resume,
          Roadmap, and Feedback — into one platform so students can practice,
          improve their profiles, and land their first roles with confidence.
        </p>
      </div>
    </section>);
}
