import { StatCards } from './stat-cards';
import { QuickAccess } from './quick-access';
import { RecentActivity } from './recent-activity';
import { ProfileSummary } from './profile-summary';
import { RecommendedSteps } from './recommended-steps';
export function DashboardShell({ stats, activities, profile, steps, }) {
    return (<>
      <StatCards {...(stats ? { stats } : {})}/>

      <QuickAccess />

      <RecentActivity {...(activities ? { activities } : {})}/>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ProfileSummary {...(profile ? { profile } : {})}/>
        <RecommendedSteps {...(steps ? { steps } : {})}/>
      </div>
    </>);
}
