import { useState } from 'react';
import { DashboardSidebar } from './dashboard-sidebar';
import { AppTopbar } from './app-topbar';
export function AppShell({ user, children, }) {
    const [menuOpen, setMenuOpen] = useState(false);
    return (<div className="min-h-screen bg-neutral-100 font-sans lg:flex">
      <DashboardSidebar open={menuOpen} onClose={() => setMenuOpen(false)}/>

      <main className="flex-1 bg-neutral-100 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
          <AppTopbar user={user} onMenu={() => setMenuOpen(true)}/>
          {children}
        </div>
      </main>
    </div>);
}
