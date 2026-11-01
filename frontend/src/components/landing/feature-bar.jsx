import { Settings, ShieldCheck, UserRound, RefreshCw } from 'lucide-react';
const FEATURES = [
    { icon: Settings, title: 'AI Powered', subtitle: 'Advanced AI Models' },
    { icon: ShieldCheck, title: 'Smart & Accurate', subtitle: 'Precise Results' },
    { icon: UserRound, title: 'Personalized', subtitle: 'Tailored for You' },
    { icon: RefreshCw, title: 'Always Improving', subtitle: 'Better Every Day' },
];
export function FeatureBar() {
    return (<section id="features" className="relative z-10 mx-auto w-full max-w-7xl px-5 sm:px-8">
      <div className="grid grid-cols-1 gap-x-6 gap-y-6 rounded-3xl bg-white px-6 py-7 text-neutral-900 shadow-2xl sm:grid-cols-2 sm:px-10 lg:grid-cols-4">
        {FEATURES.map(({ icon: Icon, title, subtitle }) => (<div key={title} className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-100">
              <Icon className="h-5 w-5 text-neutral-900" strokeWidth={1.8}/>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">{title}</span>
              <span className="text-xs text-neutral-500">{subtitle}</span>
            </div>
          </div>))}
      </div>
    </section>);
}
