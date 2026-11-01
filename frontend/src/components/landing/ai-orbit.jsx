import Link from '@/routing/link';
import { Mic, FileText, Route, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LogoMark } from '@/components/brand/logo-mark';
/** Seconds for one full revolution — kept in sync with `.orbit-track` in styles.css. */
const ORBIT_DURATION = 38;
const AGENTS = [
    { icon: Mic, label: 'Interview Agent', href: '/interview' },
    { icon: FileText, label: 'Resume Agent', href: '/resume' },
    { icon: Route, label: 'Roadmap Agent', href: '/roadmap' },
    { icon: BarChart3, label: 'Feedback Agent', href: '/feedback' },
];
export function AiOrbit() {
    return (<div className="relative mx-auto aspect-square w-full max-w-[430px]">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,theme(colors.white/8%),transparent_65%)]"/>

      {/* Concentric orbit rings */}
      <div className="pointer-events-none absolute inset-[8%] rounded-full border border-border"/>
      <div className="pointer-events-none absolute inset-[22%] animate-orbit-rev rounded-full border border-border/70">
        <span className="absolute right-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 translate-x-1/2 rounded-full bg-muted-foreground/50"/>
      </div>
      <div className="pointer-events-none absolute inset-[34%] rounded-full border border-border/50"/>

      {/* Glowing core with logo */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="absolute inset-0 -z-10 animate-core-pulse rounded-full bg-white/15 blur-2xl"/>
        <div className="flex h-28 w-28 items-center justify-center rounded-full border border-border bg-card/70 shadow-[0_0_60px_-10px_rgba(255,255,255,0.35)] backdrop-blur sm:h-36 sm:w-36">
          <LogoMark size={72} className="text-foreground"/>
        </div>
      </div>

      {/* Agents orbiting the core like planets */}
      {AGENTS.map(({ icon: Icon, label, href }, i) => {
            const delay = `${-(ORBIT_DURATION / AGENTS.length) * i}s`;
            return (<div key={label} className="orbit-track pointer-events-none absolute inset-[8%]" style={{ animationDelay: delay }}>
            <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
              <Link href={href} aria-label={label} style={{ animationDelay: delay }} className={cn('orbit-node group pointer-events-auto flex flex-col items-center gap-2 rounded-2xl outline-none', 'focus-visible:ring-2 focus-visible:ring-foreground/60')}>
                <span className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-card/80 shadow-[0_0_30px_-12px_rgba(255,255,255,0.4)] backdrop-blur transition-transform duration-200 group-hover:scale-110 group-hover:border-foreground/40 sm:h-16 sm:w-16">
                  <Icon className="h-6 w-6 text-foreground" strokeWidth={1.6}/>
                </span>
                <span className="whitespace-nowrap text-[11px] font-medium text-muted-foreground transition-colors group-hover:text-foreground sm:text-xs">
                  {label}
                </span>
              </Link>
            </div>
          </div>);
        })}
    </div>);
}
