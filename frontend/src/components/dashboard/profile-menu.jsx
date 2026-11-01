import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import { getDashboardData } from '@/services/dashboardApi';
import { DASHBOARD_QUERY_KEY } from '@/services/refreshAgentData';
import { authClient } from '@/authentication/supabaseAuth';
function initials(name) {
    return name
        .split(' ')
        .map((p) => p[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase();
}
/** Avatar button in the topbar that opens a live profile summary panel. */
export function ProfileMenu({ user }) {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const { data: dashboard } = useQuery({
        queryKey: [...DASHBOARD_QUERY_KEY, user.id],
        queryFn: getDashboardData,
        enabled: open,
        staleTime: 30_000,
        retry: 1,
    });
    const profile = dashboard?.profile;
    useEffect(() => {
        if (!open)
            return;
        function onPointerDown(e) {
            if (ref.current && !ref.current.contains(e.target))
                setOpen(false);
        }
        function onKey(e) {
            if (e.key === 'Escape')
                setOpen(false);
        }
        document.addEventListener('mousedown', onPointerDown);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);
    const name = profile?.full_name?.trim() || user.name;
    const readiness = dashboard?.stats.readinessScore ?? null;
    const rows = [
        ['Degree', profile?.degree?.trim() || 'Not set'],
        ['Target role', profile?.target_role?.trim() || 'Not set'],
        ['Location', profile?.location?.trim() || 'Not set'],
        [
            'Placement readiness',
            readiness === null ? 'Not generated yet' : `${readiness}/100`,
        ],
    ];
    function go(to) {
        setOpen(false);
        void navigate(to);
    }
    return (<div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-haspopup="menu" aria-expanded={open} aria-label="Open profile menu" className="flex items-center gap-3 rounded-full border border-neutral-200 py-1.5 pl-1.5 pr-4 transition-colors hover:border-neutral-900">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-900 text-sm font-semibold text-white">
          {initials(name)}
        </span>
        <span className="hidden flex-col items-start leading-tight sm:flex">
          <span className="text-sm font-semibold text-neutral-900">{name}</span>
          <span className="text-xs text-neutral-500">{user.email}</span>
        </span>
      </button>

      {open && (<div role="menu" className="absolute right-0 z-50 mt-2 w-72 rounded-2xl border border-neutral-200 bg-white p-4 shadow-lg">
          <div className="flex items-center gap-3 border-b border-neutral-100 pb-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-900 text-sm font-semibold text-white">
              {initials(name)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-neutral-900">{name}</p>
              <p className="truncate text-xs text-neutral-500">{user.email}</p>
            </div>
          </div>

          <dl className="flex flex-col gap-2.5 py-4">
            {rows.map(([label, value]) => (<div key={label} className="flex items-center justify-between gap-4">
                <dt className="text-xs text-neutral-500">{label}</dt>
                <dd className="truncate text-xs font-medium text-neutral-900">{value}</dd>
              </div>))}
          </dl>

          <div className="flex flex-col gap-1 border-t border-neutral-100 pt-3">
            <MenuItem icon={User} label="View profile" onClick={() => go('/profile')}/>
            
            <MenuItem icon={LogOut} label="Log out" onClick={async () => {
                setOpen(false);
                await authClient.signOut();
                void navigate('/login', { replace: true });
            }}/>
          </div>
        </div>)}
    </div>);
}
function MenuItem({ icon: Icon, label, onClick, }) {
    return (<button type="button" role="menuitem" onClick={onClick} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-900">
      <Icon className="h-4 w-4"/>
      {label}
    </button>);
}
