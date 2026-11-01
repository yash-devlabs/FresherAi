import Image from '@/components/shared/image';
import { cn } from '@/lib/utils';
/**
 * FresherAI hexagonal "F / AI" logo mark.
 * Renders the official brand asset. The brand asset is served with a transparent background so it sits cleanly
 * on both the dark landing page and the light app surfaces.
 */
export function LogoMark({ className, size = 40 }) {
    return (<Image src="/brand/fresherai-logo.png" alt="FresherAI logo" width={size} height={size} priority className={cn('shrink-0 select-none object-contain', className)} style={{ width: size, height: size }}/>);
}
