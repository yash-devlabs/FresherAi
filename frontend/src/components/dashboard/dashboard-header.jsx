import Image from '@/components/shared/image';
import { Bell, Menu } from 'lucide-react';
export function DashboardHeader({ onMenu }) {
    return (<header className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onMenu} aria-label="Open menu" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 text-neutral-700 lg:hidden">
          <Menu className="h-5 w-5"/>
        </button>
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
            Hello, Yash <span aria-hidden="true">👋</span>
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Ready to learn and grow today?
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-5">
        <button type="button" aria-label="Notifications" className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 text-neutral-700 transition-colors hover:bg-neutral-50">
          <Bell className="h-5 w-5" strokeWidth={1.8}/>
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-neutral-900"/>
        </button>

        <div className="flex items-center gap-3 rounded-full border border-neutral-200 py-1.5 pl-1.5 pr-4">
          <Image src="/avatars/student-2.png" alt="Yash Pradhan" width={36} height={36} className="h-9 w-9 rounded-full object-cover"/>
          <div className="hidden flex-col leading-tight sm:flex">
            <span className="text-sm font-semibold text-neutral-900">
              Yash Pradhan
            </span>
            <span className="text-xs text-neutral-500">Student</span>
          </div>
        </div>
      </div>
    </header>);
}
