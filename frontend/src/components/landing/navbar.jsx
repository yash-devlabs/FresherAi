import { useState } from 'react';
import Link from '@/routing/link';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BrandLogo } from '@/components/brand/brand-logo';
function NavigationLink({ href, onClick, className, children }) {
    if (href.startsWith('#')) {
        return <a href={href} onClick={onClick} className={className}>{children}</a>;
    }
    return <Link href={href} onClick={onClick} className={className}>{children}</Link>;
}

const NAV_LINKS = [
    { label: 'Home', href: '#home' },
    { label: 'Agents', href: '#agents' },
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'About', href: '#about' },
    { label: 'Login', href: '/login' },
];
export function Navbar() {
    const [open, setOpen] = useState(false);
    return (<header className="relative z-30 mx-auto w-full max-w-7xl px-5 pt-6 sm:px-8">
      <nav className="flex items-center justify-between gap-4">
        <BrandLogo />

        {/* Desktop links */}
        <div className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((link) => (<NavigationLink key={link.label} href={link.href} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              {link.label}
            </NavigationLink>))}
        </div>

        <div className="flex items-center gap-2">
          <Button asChild className="hidden rounded-full bg-primary px-5 font-medium text-primary-foreground hover:bg-primary/90 sm:inline-flex">
            <Link href="/dashboard">Get Started</Link>
          </Button>
          <button type="button" aria-label="Toggle navigation menu" aria-expanded={open} onClick={() => setOpen((v) => !v)} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-foreground lg:hidden">
            {open ? <X className="h-5 w-5"/> : <Menu className="h-5 w-5"/>}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {open && (<div className="mt-4 flex flex-col gap-1 rounded-2xl border border-border bg-card/80 p-3 backdrop-blur lg:hidden">
          {NAV_LINKS.map((link) => (<NavigationLink key={link.label} href={link.href} onClick={() => setOpen(false)} className="rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
              {link.label}
            </NavigationLink>))}
          <Button asChild className="mt-2 w-full rounded-full font-medium sm:hidden">
            <Link href="/dashboard" onClick={() => setOpen(false)}>
              Get Started
            </Link>
          </Button>
        </div>)}
    </header>);
}
