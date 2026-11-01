import { useActionState, useEffect, useState, useTransition } from 'react';
import { Route, CheckCircle2, Circle, BookOpen } from 'lucide-react';
import { generateRoadmap, toggleRoadmapTopic, } from '@/services/roadmapFormActions';
import { useAgentSync } from '@/services/refreshAgentData';
import { AgentCard, CardTitle, ErrorBanner, SubmitButton } from './agent-ui';
const idleState = { status: 'idle' };
export function RoadmapAgent({ initial }) {
    const [state, formAction] = useActionState(generateRoadmap, idleState);
    const sync = useAgentSync();
    useEffect(() => {
        if (state.status === 'success')
            sync();
    }, [state, sync]);
    // Show a freshly generated roadmap, otherwise fall back to the saved one.
    const saved = state.status === 'success' ? null : initial;
    return (<div className="flex flex-col gap-6">
      <AgentCard>
        <CardTitle>Generate your learning roadmap</CardTitle>
        <p className="mt-1.5 text-sm text-neutral-500">
          Tell us your goal and current level. AI builds a personalized
          week-by-week plan with topics and resources.
        </p>

        <form action={formAction} className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label htmlFor="goal" className="text-sm font-medium text-neutral-700">
              Goal
            </label>
            <input id="goal" name="goal" required placeholder="Become a Full Stack Developer" className="rounded-lg border border-neutral-200 px-3 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-400"/>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="currentLevel" className="text-sm font-medium text-neutral-700">
              Current level
            </label>
            <select id="currentLevel" name="currentLevel" defaultValue="beginner" className="rounded-lg border border-neutral-200 px-3 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-400">
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="weeks" className="text-sm font-medium text-neutral-700">
              Duration (weeks)
            </label>
            <input id="weeks" name="weeks" type="number" min={2} max={16} defaultValue={8} className="rounded-lg border border-neutral-200 px-3 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-400"/>
          </div>

          {state.status === 'error' && (<div className="sm:col-span-2 lg:col-span-4">
              <ErrorBanner message={state.message}/>
            </div>)}

          <div className="sm:col-span-2 lg:col-span-4">
            <SubmitButton pendingLabel="Building roadmap…">
              Generate roadmap
            </SubmitButton>
          </div>
        </form>
      </AgentCard>

      {state.status === 'success' ? (<RoadmapResult key={`fresh-${state.roadmapId}`} roadmapId={state.roadmapId} goal={state.goal} overview={state.overview} weeks={state.weeks}/>) : saved ? (<RoadmapResult key={`saved-${saved.roadmapId}`} roadmapId={saved.roadmapId} goal={saved.goal} overview={saved.overview} weeks={saved.weeks}/>) : (<AgentCard className="flex min-h-[220px] flex-col items-center justify-center text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-500">
            <Route className="h-6 w-6"/>
          </span>
          <p className="mt-4 max-w-sm text-sm text-neutral-500">
            Your personalized roadmap will appear here as a checklist you can
            track week by week.
          </p>
        </AgentCard>)}
    </div>);
}
function RoadmapResult({ roadmapId, goal, overview, weeks, }) {
    const [localWeeks, setLocalWeeks] = useState(weeks);
    const [toggleError, setToggleError] = useState(null);
    const total = localWeeks.reduce((n, w) => n + w.topics.length, 0);
    const done = localWeeks.reduce((n, w) => n + w.topics.filter((t) => t.done).length, 0);
    const progress = total > 0 ? Math.round((done / total) * 100) : 0;
    return (<div className="flex flex-col gap-6">
      <AgentCard>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>{goal}</CardTitle>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-600">
              {overview}
            </p>
          </div>
          <div className="shrink-0 rounded-2xl bg-neutral-950 px-5 py-3 text-center text-white">
            <p className="font-display text-2xl font-bold">{progress}%</p>
            <p className="text-xs text-neutral-400">
              {done}/{total} topics
            </p>
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-neutral-100">
          <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${progress}%` }}/>
        </div>
      </AgentCard>

      {toggleError && <ErrorBanner message={toggleError}/>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {localWeeks.map((week, wi) => (<AgentCard key={week.week}>
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-950 text-sm font-semibold text-white">
                {week.week}
              </span>
              <div>
                <h3 className="font-display text-base font-bold text-neutral-900">
                  {week.title}
                </h3>
                <p className="text-xs text-neutral-500">{week.focus}</p>
              </div>
            </div>

            <ul className="mt-4 flex flex-col gap-1">
              {week.topics.map((topic, ti) => (<TopicRow key={topic.name} roadmapId={roadmapId} weekIndex={wi} topicIndex={ti} name={topic.name} done={topic.done} setToggleError={setToggleError} onToggle={() => setLocalWeeks((prev) => {
                    const next = structuredClone(prev);
                    const target = next[wi]?.topics[ti];
                    if (target)
                        target.done = !target.done;
                    return next;
                })}/>))}
            </ul>

            {week.resources.length > 0 && (<div className="mt-4 border-t border-neutral-100 pt-3">
                <p className="flex items-center gap-1.5 text-xs font-medium text-neutral-500">
                  <BookOpen className="h-3.5 w-3.5"/> Resources
                </p>
                <ul className="mt-1.5 flex flex-col gap-1">
                  {week.resources.map((r) => (<li key={r} className="text-xs text-neutral-600">
                      • {r}
                    </li>))}
                </ul>
              </div>)}
          </AgentCard>))}
      </div>
    </div>);
}
function TopicRow({ roadmapId, weekIndex, topicIndex, name, done, onToggle, setToggleError }) {
    const [pending, startTransition] = useTransition();
    return (<li>
      <button type="button" disabled={pending} onClick={() => {
            startTransition(async () => {
                const result = await toggleRoadmapTopic(roadmapId, weekIndex, topicIndex);
                if (result.status === 'success') {
                    onToggle();
                    setToggleError(null);
                } else {
                    setToggleError(result.message);
                }
            });
        }} className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-60">
        {done ? (<CheckCircle2 className="h-4 w-4 shrink-0 text-green-600"/>) : (<Circle className="h-4 w-4 shrink-0 text-neutral-300"/>)}
        <span className={done ? 'text-neutral-400 line-through' : undefined}>
          {name}
        </span>
      </button>
    </li>);
}
