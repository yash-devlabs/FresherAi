import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSession, displayName } from '@/authentication/supabaseAuth';
import { AppShell } from '@/components/dashboard/app-shell';

// Private pages share the dashboard shell and require a Supabase session.
export function ProtectedLayout() {
  const { user, loading } = useSession();
  const location = useLocation();
  if (loading) return <div className="flex min-h-screen items-center justify-center bg-neutral-100"><p className="text-sm text-neutral-500">Loading your workspace…</p></div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <AppShell user={{ id: user.id, name: displayName(user), email: user.email || '', image: user.user_metadata?.avatar_url || null }}><Outlet /></AppShell>;
}
