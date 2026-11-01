import { useActionState, useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import { analyzeResume } from '@/services/resumeAnalysisApi';
import { ResumeBuilder } from './resume-builder';
import { useAgentSync } from '@/services/refreshAgentData';
import { cn } from '@/lib/utils';
import { AgentCard, CardTitle, ScoreRing, MarkerList, ErrorBanner, SubmitButton, } from './agent-ui';
const initial = { status: 'idle' };
export function ResumeAgent() {
    const [tab, setTab] = useState('analyze');
    return (<div className="flex flex-col gap-6">
      <div role="tablist" aria-label="Resume agent tabs" className="inline-flex w-fit gap-1 rounded-full border border-neutral-200 bg-white p-1">
        {[
            ['analyze', 'Analyze Resume'],
            ['build', 'Build Resume'],
        ].map(([value, label]) => (<button key={value} type="button" role="tab" aria-selected={tab === value} onClick={() => setTab(value)} className={cn('rounded-full px-5 py-2 text-sm font-medium transition-colors', tab === value
                ? 'bg-neutral-950 text-white'
                : 'text-neutral-600 hover:text-neutral-900')}>
            {label}
          </button>))}
      </div>

      {tab === 'analyze' ? <AnalyzeTab /> : <ResumeBuilder />}
    </div>);
}
function AnalyzeTab() {
    const [state, formAction] = useActionState(analyzeResume, initial);
    const sync = useAgentSync();
    useEffect(() => {
        if (state.status === 'success')
            sync();
    }, [state, sync]);
    return (<div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      <div className="lg:col-span-2">
        <AgentCard>
          <CardTitle>Analyze your resume</CardTitle>
          <p className="mt-1.5 text-sm text-neutral-500">
            Paste your resume text and target role. AI will score its ATS
            compatibility and suggest improvements.
          </p>

          <form action={formAction} className="mt-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="targetRole" className="text-sm font-medium text-neutral-700">
                Target role
              </label>
              <input id="targetRole" name="targetRole" placeholder="e.g. Frontend Developer" className="rounded-lg border border-neutral-200 px-3 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-400"/>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="jobDescription" className="text-sm font-medium text-neutral-700">
                Job description (optional)
              </label>
              <textarea id="jobDescription" name="jobDescription" rows={5} placeholder="Paste the job description to get an accurate match % and skill gap analysis…" className="resize-y rounded-lg border border-neutral-200 px-3 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-400"/>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="content" className="text-sm font-medium text-neutral-700">
                Resume text
              </label>
              <textarea id="content" name="content" required rows={10} placeholder="Paste the full text of your resume here…" className="resize-y rounded-lg border border-neutral-200 px-3 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-400"/>
            </div>

            {state.status === 'error' && (<ErrorBanner message={state.message}/>)}

            <SubmitButton pendingLabel="Analyzing…">
              Analyze resume
            </SubmitButton>
          </form>
        </AgentCard>
      </div>

      <div className="lg:col-span-3">
        {state.status === 'success' ? (<ResumeResult analysis={state.analysis}/>) : (<AgentCard className="flex h-full min-h-[320px] flex-col items-center justify-center text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-500">
              <FileText className="h-6 w-6"/>
            </span>
            <p className="mt-4 max-w-xs text-sm text-neutral-500">
              Your ATS score and personalized feedback will appear here after
              analysis.
            </p>
          </AgentCard>)}
      </div>
    </div>);
}
function ResumeResult({ analysis, }) {
    return (<div className="flex flex-col gap-6">
      <AgentCard>
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
          <ScoreRing value={analysis.atsScore} label="ATS Score" suffix="/100"/>
          {typeof analysis.matchPercent === 'number' && (<ScoreRing value={analysis.matchPercent} label="Resume Match" suffix="%"/>)}
          <div className="flex-1">
            <CardTitle>Overall assessment</CardTitle>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">
              {analysis.summary}
            </p>
          </div>
        </div>
      </AgentCard>

      {(analysis.sectionReview?.length ?? 0) > 0 && (<AgentCard>
          <CardTitle>Section-wise review</CardTitle>
          <div className="mt-4 flex flex-col gap-3">
            {analysis.sectionReview.map((s) => (<div key={s.section} className="rounded-xl border border-neutral-200 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-neutral-900">
                    {s.section}
                  </span>
                  <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-neutral-600">
                    {s.rating}
                  </span>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">
                  {s.notes}
                </p>
              </div>))}
          </div>
        </AgentCard>)}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <AgentCard>
          <CardTitle>Strengths</CardTitle>
          <div className="mt-4">
            <MarkerList items={analysis.strengths} tone="positive"/>
          </div>
        </AgentCard>
        <AgentCard>
          <CardTitle>Weaknesses</CardTitle>
          <div className="mt-4">
            <MarkerList items={analysis.weaknesses} tone="negative"/>
          </div>
        </AgentCard>
      </div>

      <AgentCard>
        <CardTitle>Suggestions</CardTitle>
        <div className="mt-4">
          <MarkerList items={analysis.suggestions} tone="neutral"/>
        </div>
      </AgentCard>

      {(analysis.skillGaps?.length ?? 0) > 0 && (<AgentCard>
          <CardTitle>Skill gap analysis</CardTitle>
          <div className="mt-4 flex flex-col gap-3">
            {analysis.skillGaps.map((g) => (<div key={g.skill} className="rounded-xl border border-neutral-200 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-neutral-900">
                    {g.skill}
                  </span>
                  <span className="rounded-full bg-neutral-950 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-white">
                    {g.importance}
                  </span>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">
                  {g.howToClose}
                </p>
              </div>))}
          </div>
        </AgentCard>)}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {(analysis.missingTechnicalSkills?.length ?? 0) > 0 && (<AgentCard>
            <CardTitle>Missing technical skills</CardTitle>
            <div className="mt-4">
              <MarkerList items={analysis.missingTechnicalSkills} tone="negative"/>
            </div>
          </AgentCard>)}
        {(analysis.missingSoftSkills?.length ?? 0) > 0 && (<AgentCard>
            <CardTitle>Missing soft skills</CardTitle>
            <div className="mt-4">
              <MarkerList items={analysis.missingSoftSkills} tone="neutral"/>
            </div>
          </AgentCard>)}
      </div>

      {analysis.missingKeywords.length > 0 && (<AgentCard>
          <CardTitle>Missing keywords</CardTitle>
          <div className="mt-4 flex flex-wrap gap-2">
            {analysis.missingKeywords.map((kw) => (<span key={kw} className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                {kw}
              </span>))}
          </div>
        </AgentCard>)}

      {analysis.recruiterPerspective && (<AgentCard>
          <CardTitle>Recruiter perspective</CardTitle>
          <p className="mt-3 text-sm leading-relaxed text-neutral-600">
            {analysis.recruiterPerspective}
          </p>
        </AgentCard>)}

      {analysis.finalVerdict && (<AgentCard className="bg-neutral-950 text-white">
          <h3 className="font-display text-base font-semibold">Final verdict</h3>
          <p className="mt-3 text-sm leading-relaxed text-neutral-300">
            {analysis.finalVerdict}
          </p>
        </AgentCard>)}
    </div>);
}
