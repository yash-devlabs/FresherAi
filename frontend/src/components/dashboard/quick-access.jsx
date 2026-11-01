import Link from '@/routing/link';
import { Mic, FileText, Route, BarChart3, ArrowRight } from 'lucide-react';
const AGENTS = [
    {
        icon: Mic,
        title: 'Interview Agent',
        action: 'Start Interview Practice',
        href: '/interview',
    },
    {
        icon: FileText,
        title: 'Resume Agent',
        action: 'Analyze / Build Resume',
        href: '/resume',
    },
    {
        icon: Route,
        title: 'Roadmap Agent',
        action: 'Get Your Roadmap',
        href: '/roadmap',
    },
    {
        icon: BarChart3,
        title: 'Feedback Agent',
        action: 'View Feedback',
        href: '/feedback',
    },
];
export function QuickAccess() {
    return (<section aria-labelledby="quick-access-heading">
      <h2 id="quick-access-heading" className="mb-4 font-display text-lg font-bold text-neutral-900">
        Quick Access
      </h2>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {AGENTS.map(({ icon: Icon, title, action, href }) => (<Link key={title} href={href} className="group flex flex-col justify-between gap-8 rounded-3xl bg-neutral-950 p-6 text-left text-white transition-transform hover:-translate-y-1 hover:bg-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
              <Icon className="h-5 w-5" strokeWidth={1.8}/>
            </span>
            <span className="flex flex-col gap-1">
              <span className="font-display text-lg font-semibold">
                {title}
              </span>
              <span className="flex items-center gap-1.5 text-sm text-neutral-400 transition-colors group-hover:text-white">
                {action}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"/>
              </span>
            </span>
          </Link>))}
      </div>
    </section>);
}
