import Link from '@/routing/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BrandLogo } from '@/components/brand/brand-logo';
export function ComingSoon({ title, description }) {
    return (<div className="relative flex min-h-screen flex-col bg-background font-sans">
      <header className="mx-auto w-full max-w-7xl px-5 pt-6 sm:px-8">
        <BrandLogo />
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-5 py-20 text-center sm:px-8">
        <span className="inline-flex items-center rounded-full border border-gold/40 bg-gold-soft px-4 py-1.5 text-xs font-medium text-gold">
          Coming Soon
        </span>
        <h1 className="mt-6 font-display text-4xl font-bold tracking-tight text-balance sm:text-5xl">
          {title}
        </h1>
        <p className="mt-5 max-w-md text-muted-foreground leading-relaxed">
          {description}
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Button asChild className="h-12 rounded-full bg-primary px-6 font-medium text-primary-foreground hover:bg-primary/90">
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
          <Button asChild variant="outline" className="h-12 rounded-full border-border bg-transparent px-6 font-medium text-foreground hover:bg-accent">
            <Link href="/">
              <ArrowLeft className="mr-1 h-4 w-4"/>
              Back to Home
            </Link>
          </Button>
        </div>
      </main>
    </div>);
}
