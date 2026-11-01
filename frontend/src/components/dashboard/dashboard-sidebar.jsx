import { useState } from 'react';
import Link from '@/routing/link';
import { usePathname, useRouter } from '@/routing/navigation';
import { LayoutDashboard, Mic, FileText, Route, BarChart3, UserRound, Settings, LogOut, Loader2, X, } from 'lucide-react';
import { cn } from '@/lib/utils';
import { authClient } from '@/authentication/supabaseAuth';
import { LogoMark } from '@/components/brand/logo-mark';
const PRIMARY = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: Mic, label: 'Interview Agent', href: '/interview' },
    { icon: FileText, label: 'Resume Agent', href: '/resume' },
    { icon: Route, label: 'Roadmap Agent', href: '/roadmap' },
    { icon: BarChart3, label: 'Feedback Agent', href: '/feedback' },
];
const SECONDARY = [
    { icon: UserRound, label: 'Profile', href: '/profile' },
    { icon: Settings, label: 'Settings', href: '/settings' },
];
function NavList({ items, pathname, onNavigate, }) {
    return (<nav className="flex flex-col gap-1">
      {items.map(({ icon: Icon, label, href }) => {
            const active = pathname === href;
            return (<Link key={label} href={href} onClick={onNavigate} aria-current={active ? 'page' : undefined} className={cn('flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors', active
                    ? 'bg-white text-neutral-900'
                    : 'text-neutral-400 hover:bg-white/5 hover:text-white')}>
            <Icon className="h-[18px] w-[18px]" strokeWidth={1.8}/>
            {label}
          </Link>);
        })}
    </nav>);
}
export function DashboardSidebar({ open, onClose }) {
    const pathname = usePathname();
    const router = useRouter();
    const [loggingOut, setLoggingOut] = useState(false);
    async function handleLogout() {
        setLoggingOut(true);
        try {
            await authClient.signOut();
            router.push('/login');
            router.refresh();
        }
        catch {
            setLoggingOut(false);
        }
    }
    return (<>
      {/* Mobile overlay */}
      {open && (<div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} aria-hidden="true"/>)}

      <aside className={cn('fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col bg-neutral-950 p-5 transition-transform duration-300 lg:sticky lg:top-0 lg:z-0 lg:h-screen lg:translate-x-0', open ? 'translate-x-0' : '-translate-x-full')}>
        <div className="mb-8 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <LogoMark size={36}/>
            <span className="font-display text-lg font-bold tracking-tight text-white">
              FresherAI
            </span>
          </Link>
          <button type="button" onClick={onClose} aria-label="Close menu" className="inline-flex h-9 w-9 items-center justify-center rounded-full text-neutral-400 hover:text-white lg:hidden">
            <X className="h-5 w-5"/>
          </button>
        </div>

        <NavList items={PRIMARY} pathname={pathname} onNavigate={onClose}/>

        <div className="my-5 h-px bg-white/10"/>

        <NavList items={SECONDARY} pathname={pathname} onNavigate={onClose}/>

        <button type="button" onClick={handleLogout} disabled={loggingOut} className="mt-auto flex items-center justify-center gap-2 rounded-2xl border border-white/15 py-3 text-sm font-medium text-white transition-colors hover:bg-white/5 disabled:opacity-60">
          {loggingOut ? (<Loader2 className="h-[18px] w-[18px] animate-spin" strokeWidth={1.8}/>) : (<LogOut className="h-[18px] w-[18px]" strokeWidth={1.8}/>)}
          {loggingOut ? 'Logging out…' : 'Logout'}
        </button>
      </aside>
    </>);
}
