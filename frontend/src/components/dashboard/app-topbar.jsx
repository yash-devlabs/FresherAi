import { usePathname } from '@/routing/navigation';
import { Menu } from 'lucide-react';
import { ProfileMenu } from './profile-menu';
const TITLES = {
    '/dashboard': {
        title: 'Hello',
        subtitle: 'Ready to learn and grow today?',
    },
    '/interview': {
        title: 'Interview Agent',
        subtitle: 'Practice mock interviews and get instant AI feedback.',
    },
    '/resume': {
        title: 'Resume Agent',
        subtitle: 'Analyze your resume and boost your ATS score.',
    },
    '/roadmap': {
        title: 'Roadmap Agent',
        subtitle: 'Build a personalized week-by-week prep plan.',
    },
    '/feedback': {
        title: 'Feedback Agent',
        subtitle: 'Get an honest read on your placement readiness.',
    },
    '/profile': {
        title: 'Profile',
        subtitle: 'Keep your details current so every agent can personalize.',
    },
    '/settings': {
        title: 'Settings',
        subtitle: 'Manage preferences and your account.',
    },
};
export function AppTopbar({ user, onMenu, }) {
    const pathname = usePathname();
    const meta = TITLES[pathname] ?? TITLES['/dashboard'];
    const firstName = user.name.split(' ')[0] ?? user.name;
    const isDashboard = pathname === '/dashboard';
    return (<header className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onMenu} aria-label="Open menu" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 text-neutral-700 lg:hidden">
          <Menu className="h-5 w-5"/>
        </button>
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
            {isDashboard ? `Hello, ${firstName}` : meta.title}
            {isDashboard && <span aria-hidden="true"> 👋</span>}
          </h1>
          <p className="mt-1 text-sm text-neutral-500">{meta.subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-5">
        <ProfileMenu user={user}/>
      </div>
    </header>);
}
