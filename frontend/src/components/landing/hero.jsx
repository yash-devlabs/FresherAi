import Link from '@/routing/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AiOrbit } from './ai-orbit';
export function Hero() {
    return (<section id="home" className="relative mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-12 overflow-x-clip px-5 pt-14 pb-8 sm:px-8 lg:grid-cols-2 lg:gap-8 lg:pt-20">
      {/* Left column */}
      <div className="flex flex-col items-start">
        <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold-soft px-4 py-1.5">
          <Sparkles className="h-3.5 w-3.5 text-gold"/>
          <span className="text-xs font-medium text-gold">
            Multi-AI Powered Career Preparation Platform
          </span>
        </div>

        <h1 className="mt-7 font-display text-5xl font-bold leading-[1.05] tracking-tight text-balance sm:text-6xl lg:text-7xl">
          Prepare Smarter.
          <br />
          <span className="text-muted-foreground">Succeed Faster.</span>
        </h1>

        <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
          FresherAI uses four powerful AI agents to help you build skills,
          improve your profile, practice better, and get placement ready.
        </p>

        <div className="mt-9 flex flex-wrap items-center gap-3">
          <Button asChild className="group h-12 rounded-full bg-primary px-6 font-medium text-primary-foreground hover:bg-primary/90">
            <Link href="/dashboard">
              Get Started Free
              <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5"/>
            </Link>
          </Button>
          <a href="#agents">
  <Button variant="outline" className="h-12 rounded-full border-border bg-transparent px-6 font-medium text-foreground hover:bg-accent">
    Explore Agents
  </Button>
</a>
        </div>

      </div>

      {/* Right column */}
      <div className="relative">
        <AiOrbit />
      </div>
    </section>);
}
