import { useState, useTransition } from 'react';
import { BarChart3, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@/services/useApiFunction';
import { generateFeedback, getLatestFeedback } from '@/services/feedbackApi';
import { AgentCard, CardTitle, ScoreRing, MarkerList, ErrorBanner } from './agent-ui';
import { useAgentSync } from '@/services/refreshAgentData';
export function FeedbackAgent() {
    const run = useServerFn(generateFeedback);
    const fetchLatest = useServerFn(getLatestFeedback);
    const sync = useAgentSync();
    const [report, setReport] = useState(null);
    const [error, setError] = useState(null);
    const [notes, setNotes] = useState('');
    const [targetRole, setTargetRole] = useState('');
    const [pending, startTransition] = useTransition();
    const { data: latest } = useQuery({
        queryKey: ['feedback', 'latest'],
        queryFn: () => fetchLatest({ data: undefined }),
    });
    const shown = report ?? (latest?.report ?? null);
    function handleSubmit(e) {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
            try {
                const result = await run({ data: { notes, targetRole } });
                if (result.status === 'success') {
                    setReport(result.report);
                    sync();
                }
                else if (result.status === 'error') {
                    setError(result.message);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Could not generate your readiness report. Please try again.');
            }
        });
    }
    return (<div className="flex flex-col gap-6">
      <AgentCard>
        <CardTitle>Placement readiness report</CardTitle>
        <p className="mt-1.5 text-sm text-neutral-500">
          AI reviews everything the other agents have produced — your resume
          analyses, mock interviews and roadmap progress — and scores how ready
          you are.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="targetRole" className="text-sm font-medium text-neutral-700">
              Target role (optional)
            </label>
            <input id="targetRole" value={targetRole} onChange={(e) => setTargetRole(e.target.value)} placeholder="e.g. Backend Developer" className="rounded-lg border border-neutral-200 px-3 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-400"/>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="notes" className="text-sm font-medium text-neutral-700">
              Anything else we should know? (optional)
            </label>
            <textarea id="notes" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Projects, internships, confidence level, upcoming deadlines…" className="resize-y rounded-lg border border-neutral-200 px-3 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-400"/>
          </div>

          {error && <ErrorBanner message={error}/>}

          <div>
            <button type="submit" disabled={pending} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-neutral-950 px-6 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60">
              {pending && <Loader2 className="h-4 w-4 animate-spin"/>}
              {pending ? 'Analyzing your progress…' : 'Generate report'}
            </button>
          </div>
        </form>
      </AgentCard>

      {shown ? (<FeedbackResult report={shown}/>) : (<AgentCard className="flex min-h-[220px] flex-col items-center justify-center text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-500">
            <BarChart3 className="h-6 w-6"/>
          </span>
          <p className="mt-4 max-w-sm text-sm text-neutral-500">
            Your readiness score, strengths and next steps will appear here.
          </p>
        </AgentCard>)}
    </div>);
}
function FeedbackResult({ report }) {
    return (<div className="flex flex-col gap-6">
      <AgentCard>
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-8">
          <ScoreRing value={report.readinessScore} label="Readiness" suffix="/100"/>
          <div className="flex-1">
            <CardTitle>Overall assessment</CardTitle>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">{report.summary}</p>
          </div>
        </div>
      </AgentCard>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <AgentCard>
          <div className="flex items-center justify-between">
            <CardTitle>Communication</CardTitle>
            {typeof report.communication.score === 'number' ? (<span className="rounded-full bg-neutral-950 px-3 py-1 text-xs font-semibold text-white">
                {report.communication.score}/100
              </span>) : (<span className="rounded-full border border-neutral-200 px-3 py-1 text-xs font-semibold text-neutral-500">
                Not available
              </span>)}
          </div>
          <p className="mt-3 text-sm leading-relaxed text-neutral-600">
            {report.communication.notes}
          </p>
        </AgentCard>
        <AgentCard>
          <div className="flex items-center justify-between">
            <CardTitle>Technical</CardTitle>
            <span className="rounded-full bg-neutral-950 px-3 py-1 text-xs font-semibold text-white">
              {report.technical.score}/100
            </span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-neutral-600">
            {report.technical.notes}
          </p>
        </AgentCard>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <AgentCard>
          <CardTitle>Strengths</CardTitle>
          <div className="mt-4">
            <MarkerList items={report.strengths} tone="positive"/>
          </div>
        </AgentCard>
        <AgentCard>
          <CardTitle>Improvements</CardTitle>
          <div className="mt-4">
            <MarkerList items={report.improvements} tone="negative"/>
          </div>
        </AgentCard>
      </div>

      <AgentCard>
        <CardTitle>Next steps</CardTitle>
        <div className="mt-4">
          <MarkerList items={report.nextSteps} tone="neutral"/>
        </div>
      </AgentCard>
    </div>);
}
