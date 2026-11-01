import { useQuery } from '@tanstack/react-query';
import { RoadmapAgent } from '@/components/agents/roadmap-agent';
import { getLatestRoadmap } from '@/services/roadmapApi';

// Loads the latest saved roadmap before rendering the Roadmap Agent.
export function RoadmapPage() {
  const { data, isLoading } = useQuery({ queryKey: ['roadmap', 'latest'], queryFn: getLatestRoadmap });
  if (isLoading) return <RoadmapAgent initial={null} />;

  const initial = data
    ? { roadmapId: data.id, goal: data.goal, overview: data.overview ?? '', weeks: data.weeks ?? [] }
    : null;

  return <RoadmapAgent key={initial?.roadmapId ?? 'empty'} initial={initial} />;
}
