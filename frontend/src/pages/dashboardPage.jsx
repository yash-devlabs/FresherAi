import { useQuery } from '@tanstack/react-query';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { getDashboardData } from '@/services/dashboardApi';
import { useSession } from '@/authentication/supabaseAuth';

function relativeTime(iso) {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 60) return `${Math.max(minutes, 1)} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? 'Yesterday' : `${days} days ago`;
}

// Loads the same dashboard statistics and activity feed used by the original app.
export function DashboardPage() {
  const { user } = useSession();
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ['dashboard', user?.id],
    queryFn: getDashboardData,
    enabled: Boolean(user?.id),
    staleTime: 30_000,
    retry: 1,
  });
  if (isPending) {
    return <div role="status" className="rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-500">Loading your dashboard…</div>;
  }
  if (isError || !data) {
    return <>
      <div role="alert" className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        <span>Could not load your dashboard: {error?.message || 'The server returned no dashboard data.'}</span>
        <button type="button" onClick={() => refetch()} className="rounded-full border border-red-300 px-4 py-2 font-medium hover:bg-red-100">Try again</button>
      </div>
      <DashboardShell />
    </>;
  }

  const s = data.stats;
  const stats = [
    { title: 'Interview Score', value: s.interviewScore == null ? '—' : String(s.interviewScore), unit: s.interviewScore == null ? '' : '/100', note: s.interviewScore == null ? 'No interviews yet' : `Average of ${s.interviewCount} mock interview${s.interviewCount === 1 ? '' : 's'}`, color: '#16a34a', data: [s.interviewScore ?? 0] },
    { title: 'Resume ATS Score', value: s.resumeScore == null ? '—' : String(s.resumeScore), unit: s.resumeScore == null ? '' : '/100', note: s.resumeScore == null ? 'No resume analyzed yet' : 'Latest analysis', color: '#16a34a', data: [s.resumeScore ?? 0] },
    { title: 'Roadmap Progress', value: s.roadmapProgress == null ? '—' : String(s.roadmapProgress), unit: s.roadmapProgress == null ? '' : '%', note: s.roadmapProgress == null ? 'No roadmap yet' : 'Topics completed', color: '#7c3aed', data: [s.roadmapProgress ?? 0] },
    { title: 'Placement Readiness', value: s.readinessScore == null ? '—' : String(s.readinessScore), unit: s.readinessScore == null ? '' : '/100', note: s.readinessScore == null ? 'No report yet' : 'Latest readiness report', color: '#2563eb', data: [s.readinessScore ?? 0] },
  ];

  const activities = (data.activities || []).map((activity) => ({
    ...activity,
    time: relativeTime(activity.created_at),
  }));

  const profile = {
    name: data.profile?.full_name?.trim() || '',
    degree: data.profile?.degree ?? null,
    college: data.profile?.college ?? null,
    location: data.profile?.location ?? null,
    targetRole: data.profile?.target_role ?? null,
    readinessScore: s.readinessScore,
  };

  return <DashboardShell stats={stats} activities={activities} profile={profile} steps={data.recommendations || []} />;
}
