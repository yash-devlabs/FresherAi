import { GraduationCap, MapPin, Briefcase, School } from 'lucide-react';
import Link from '@/routing/link';
function initials(name) {
    return (name
        .split(' ')
        .map((p) => p[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'FA');
}
export function ProfileSummary({ profile }) {
    const name = profile?.name?.trim() || 'Your profile';
    const meta = [
        { icon: GraduationCap, label: profile?.degree },
        { icon: School, label: profile?.college },
        { icon: MapPin, label: profile?.location },
        {
            icon: Briefcase,
            label: profile?.targetRole ? `Target: ${profile.targetRole}` : null,
        },
    ].filter((m) => Boolean(m.label));
    return (<section aria-label="Student profile summary" className="flex flex-col rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-base font-semibold text-white">
          {initials(name)}
        </span>
        <div className="min-w-0">
          <p className="truncate font-display text-lg font-bold text-neutral-900">
            {name}
          </p>
          <p className="text-sm text-neutral-500">
            {profile?.readinessScore === null || profile?.readinessScore === undefined
            ? 'Placement readiness not measured yet'
            : `Placement Readiness · ${profile.readinessScore}%`}
          </p>
        </div>
      </div>

      {meta.length > 0 ? (<ul className="mt-5 flex flex-col gap-2.5">
          {meta.map(({ icon: Icon, label }) => (<li key={label} className="flex items-center gap-2.5 text-sm text-neutral-600">
              <Icon className="h-4 w-4 shrink-0 text-neutral-400" strokeWidth={1.8}/>
              <span className="truncate">{label}</span>
            </li>))}
        </ul>) : (<p className="mt-5 text-sm text-neutral-500">
          Add your degree, college, location and target role so the agents can
          personalize their advice.
        </p>)}

      <Link href="/profile" className="mt-6 inline-flex items-center justify-center rounded-2xl border border-neutral-200 py-2.5 text-sm font-medium text-neutral-900 transition-colors hover:border-neutral-900">
        {meta.length > 0 ? 'Edit profile' : 'Complete your profile'}
      </Link>
    </section>);
}
