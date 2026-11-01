import { Mic, FileText, Route, BarChart3 } from 'lucide-react';
const ICONS = {
    interview: Mic,
    resume: FileText,
    roadmap: Route,
    feedback: BarChart3,
};
export function RecentActivity({ activities, }) {
    const items = activities ?? [];
    return (<section aria-labelledby="recent-activity-heading" className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h2 id="recent-activity-heading" className="mb-5 font-display text-lg font-bold text-neutral-900">
        Recent Activity
      </h2>
      {items.length === 0 ? (<p className="py-8 text-center text-sm text-neutral-500">
          No activity yet. Run any agent to see your history here.
        </p>) : (<ul className="flex flex-col divide-y divide-neutral-100">
          {items.map(({ type, title, subtitle, score, time }, i) => {
                const Icon = ICONS[type];
                return (<li key={`${title}-${i}`} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-800">
                    <Icon className="h-[18px] w-[18px]" strokeWidth={1.8}/>
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-neutral-900">
                      {title}
                    </p>
                    <p className="truncate text-xs text-neutral-500">
                      {subtitle}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end text-right">
                  <span className="text-sm font-semibold text-green-600">
                    {score}
                  </span>
                  <span className="text-xs text-neutral-400">{time}</span>
                </div>
              </li>);
            })}
        </ul>)}
    </section>);
}
