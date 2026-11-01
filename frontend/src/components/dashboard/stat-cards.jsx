import { Sparkline } from './sparkline';
export function StatCards({ stats }) {
    const items = stats ?? [];
    if (items.length === 0) {
        return (<section aria-label="Progress overview">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (<div key={i} className="h-[132px] animate-pulse rounded-3xl border border-neutral-200 bg-white shadow-sm"/>))}
        </div>
      </section>);
    }
    return (<section aria-label="Progress overview">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((stat) => (<div key={stat.title} className="flex flex-col justify-between rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-neutral-500">{stat.title}</p>
            <div className="mt-4 flex items-end justify-between gap-3">
              <div>
                <p className="font-display text-3xl font-bold text-neutral-900">
                  {stat.value}
                  <span className="text-base font-semibold text-neutral-400">
                    {stat.unit}
                  </span>
                </p>
                <p className="mt-1 text-xs text-neutral-500">{stat.note}</p>
              </div>
              <Sparkline data={stat.data} color={stat.color} className="h-10 w-24"/>
            </div>
          </div>))}
      </div>
    </section>);
}
