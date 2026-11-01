import Link from '@/routing/link';
import { Mic, FileText, Route, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
const CARDS = [
    {
        icon: Mic,
        title: 'Interview Agent',
        action: 'Start Interview',
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
        action: 'Generate New Roadmap',
        href: '/roadmap',
    },
    {
        icon: BarChart3,
        title: 'Feedback Agent',
        action: 'View All Feedback',
        href: '/feedback',
    },
];
export function AgentPreviewCards() {
    return (<section id="agents" className="mx-auto w-full max-w-7xl px-5 sm:px-8">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {CARDS.map(({ icon: Icon, title, action, href }) => (<div key={title} className="flex flex-col items-start gap-4 rounded-t-3xl border border-b-0 border-border bg-card px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-secondary">
                <Icon className="h-5 w-5 text-foreground" strokeWidth={1.7}/>
              </div>
              <span className="truncate font-display text-lg font-semibold">
                {title}
              </span>
            </div>
            <Button asChild className="w-full shrink-0 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 sm:w-auto">
              <Link href={href}>{action}</Link>
            </Button>
          </div>))}
      </div>
    </section>);
}
