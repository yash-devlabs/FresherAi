import { ArrowUpRight } from 'lucide-react';
import Link from '@/routing/link';
export function RecommendedSteps({ steps }) {
    const items = steps ?? [];
    return (<section aria-labelledby="recommended-steps-heading" className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h2 id="recommended-steps-heading" className="mb-5 font-display text-lg font-bold text-neutral-900">
        Recommended Next Steps
      </h2>
      {items.length === 0 ? (<p className="py-8 text-center text-sm text-neutral-500">
          You are all caught up. Keep practicing to unlock new suggestions.
        </p>) : (<ul className="flex flex-col gap-3">
          {items.map(({ title, subtitle, tag, href }) => (<li key={title}>
              <Link href={href} className="group flex w-full items-center justify-between gap-4 rounded-2xl border border-neutral-200 p-4 text-left transition-colors hover:border-neutral-900">
                <div className="min-w-0">
                  <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600">
                    {tag}
                  </span>
                  <p className="mt-2 truncate text-sm font-semibold text-neutral-900">
                    {title}
                  </p>
                  <p className="truncate text-xs text-neutral-500">{subtitle}</p>
                </div>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-white transition-transform group-hover:scale-105">
                  <ArrowUpRight className="h-4 w-4"/>
                </span>
              </Link>
            </li>))}
        </ul>)}
    </section>);
}
