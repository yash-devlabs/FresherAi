import { cn } from '@/lib/utils';
import { LogoMark } from './logo-mark';
export function BrandLogo({ className, withTagline = true, markSize = 40, }) {
    return (<a href="/" className={cn('flex items-center gap-3 text-foreground transition-opacity hover:opacity-90', className)}>
      <LogoMark size={markSize} className="text-foreground"/>
      <span className="flex flex-col leading-none">
        <span className="font-display text-xl font-bold tracking-tight">
          FresherAI
        </span>
        {withTagline && (<span className="mt-1 text-[10px] font-medium tracking-[0.2em] text-muted-foreground">
            PREPARE • IMPROVE • SUCCEED
          </span>)}
      </span>
    </a>);
}
