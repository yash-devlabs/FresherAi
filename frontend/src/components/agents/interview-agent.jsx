import { useState, useTransition } from 'react';
import { Mic, Loader2, CheckCircle2, RotateCcw } from 'lucide-react';
import { useServerFn } from '@/services/useApiFunction';
import { startInterview, submitAnswer, finishInterview, } from '@/services/interviewApi';
import { useAgentSync } from '@/services/refreshAgentData';
import { AgentCard, CardTitle, ScoreRing, ErrorBanner, } from './agent-ui';

function splitEvaluation(feedback = '', score = 0) {
    const match = feedback.match(/Verdict:\s*(.*?)\s*Feedback:\s*([\s\S]*)/i);
    if (match) return { verdict: match[1].trim(), feedback: match[2].trim() };
    const verdict = score === 0 ? 'Unanswered' : score >= 85 ? 'Correct' : score >= 50 ? 'Partially Correct' : 'Incorrect';
    return { verdict, feedback: feedback.trim() || 'No additional feedback was provided.' };
}
export function InterviewAgent() {
    const start = useServerFn(startInterview);
    const [session, setSession] = useState(null);
    const [completion, setCompletion] = useState(null);
    const [error, setError] = useState(null);
    const [starting, startTransition] = useTransition();
    const [role, setRole] = useState('');
    const [interviewType, setInterviewType] = useState('technical');
    const [difficulty, setDifficulty] = useState('medium');
    const [count, setCount] = useState(5);
    function handleStart(e) {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
            try {
                const result = await start({
                    data: { role, interviewType, difficulty, count },
                });
                if (result.status === 'success') {
                    setCompletion(null);
                    setSession(result.session);
                }
                else if (result.status === 'error') {
                    setError(result.message);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Could not start the interview. Please try again.');
            }
        });
    }
    return (<div className="flex flex-col gap-6">
      <AgentCard>
        <CardTitle>Start a mock interview</CardTitle>
        <p className="mt-1.5 text-sm text-neutral-500">
          Pick a role and difficulty. AI asks the questions, grades every answer
          and gives you an overall assessment at the end.
        </p>

        <form onSubmit={handleStart} className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-1.5 lg:col-span-2">
            <label htmlFor="role" className="text-sm font-medium text-neutral-700">
              Role
            </label>
            <input id="role" required value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Frontend Developer" className="rounded-lg border border-neutral-200 px-3 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-400"/>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="interviewType" className="text-sm font-medium text-neutral-700">
              Interview type
            </label>
            <select id="interviewType" value={interviewType} onChange={(e) => setInterviewType(e.target.value)} className="rounded-lg border border-neutral-200 px-3 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-400">
              <option value="technical">Technical</option>
              <option value="behavioral">Behavioral</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="difficulty" className="text-sm font-medium text-neutral-700">
              Difficulty
            </label>
            <select id="difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="rounded-lg border border-neutral-200 px-3 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-400">
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="count" className="text-sm font-medium text-neutral-700">
              Questions
            </label>
            <input id="count" type="number" min={3} max={8} value={count} onChange={(e) => setCount(Number(e.target.value))} className="rounded-lg border border-neutral-200 px-3 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-400"/>
          </div>

          {error && (<div className="sm:col-span-2 lg:col-span-4">
              <ErrorBanner message={error}/>
            </div>)}

          <div className="sm:col-span-2 lg:col-span-4">
            <button type="submit" disabled={starting} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-neutral-950 px-6 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60">
              {starting && <Loader2 className="h-4 w-4 animate-spin"/>}
              {starting
            ? 'Preparing questions…'
            : session
                ? 'Start a new interview'
                : 'Start interview'}
            </button>
          </div>
        </form>
      </AgentCard>

      {session ? (<InterviewRoom key={session.id} session={session} completion={completion} onComplete={setCompletion}/>) : (<AgentCard className="flex min-h-[220px] flex-col items-center justify-center text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-500">
            <Mic className="h-6 w-6"/>
          </span>
          <p className="mt-4 max-w-sm text-sm text-neutral-500">
            Your interview questions will appear here. Answer them one by one to
            get instant AI feedback and a score.
          </p>
        </AgentCard>)}
    </div>);
}
function InterviewRoom({ session, completion, onComplete, }) {
    const grade = useServerFn(submitAnswer);
    const finish = useServerFn(finishInterview);
    const sync = useAgentSync();
    const [turns, setTurns] = useState(session.transcript);
    const [answers, setAnswers] = useState(() => session.transcript.map(() => ''));
    const [busyIndex, setBusyIndex] = useState(null);
    const [error, setError] = useState(null);
    const [finishing, setFinishing] = useState(false);
    const answered = turns.filter((t) => typeof t.score === 'number').length;
    async function handleAnswer(index) {
        setError(null);
        setBusyIndex(index);
        try {
            const result = await grade({
                data: { interviewId: session.id, questionIndex: index, answer: answers[index] ?? '' },
            });
            if (!result.ok || !result.turn) {
                setError(result.message ?? 'Could not grade that answer.');
                return;
            }
            const turn = result.turn;
            setTurns((prev) => prev.map((t, i) => (i === index ? turn : t)));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not grade that answer. Please try again.');
        } finally {
            setBusyIndex(null);
        }
    }
    async function handleFinish() {
        setError(null);
        setFinishing(true);
        try {
            const result = await finish({ data: { interviewId: session.id } });
            if (!result.ok) {
                setError(result.message ?? 'Could not complete the interview.');
                return;
            }
            sync();
            onComplete({ overallScore: result.overallScore ?? 0, summary: result.summary ?? '' });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not complete the interview. Please try again.');
        } finally {
            setFinishing(false);
        }
    }
    return (<div className="flex flex-col gap-6">
      <AgentCard>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>
              {session.role} · {session.interviewType}
            </CardTitle>
            <p className="mt-1 text-sm text-neutral-500">
              {session.difficulty} difficulty · {answered}/{turns.length} answered
            </p>
          </div>
          {!completion && (<button type="button" onClick={handleFinish} disabled={finishing || answered === 0} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-neutral-200 px-5 text-sm font-semibold text-neutral-900 transition-colors hover:bg-neutral-50 disabled:opacity-50">
              {finishing ? <Loader2 className="h-4 w-4 animate-spin"/> : <CheckCircle2 className="h-4 w-4"/>}
              {finishing ? 'Scoring…' : 'Finish & score'}
            </button>)}
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-neutral-100">
          <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${turns.length ? (answered / turns.length) * 100 : 0}%` }}/>
        </div>
      </AgentCard>

      {error && <ErrorBanner message={error}/>}

      {completion && (<AgentCard>
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-8">
            <ScoreRing value={completion.overallScore} label="Overall" suffix="/100"/>
            <div className="flex-1">
              <CardTitle>Overall assessment</CardTitle>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">{completion.summary}</p>
            </div>
          </div>
        </AgentCard>)}

      {turns.map((turn, i) => (<AgentCard key={`${session.id}-${i}`}>
          <div className="flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-neutral-950 text-sm font-semibold text-white">
              {i + 1}
            </span>
            <p className="pt-1 text-sm font-medium leading-relaxed text-neutral-900">
              {turn.question}
            </p>
          </div>

          {typeof turn.score === 'number' ? (<div className="mt-4 rounded-2xl bg-neutral-50 p-4">
              <p className="text-sm text-neutral-700">{turn.answer || <span className="italic text-neutral-400">No answer provided</span>}</p>
              {(() => {
                const evaluation = splitEvaluation(turn.feedback, turn.score);
                return <div className="mt-3 space-y-2 border-t border-neutral-200 pt-3 text-sm text-neutral-600">
                  <p><span className="font-semibold text-neutral-900">Verdict &amp; Score:</span> {evaluation.verdict || 'Evaluation'} <span className="ml-1 rounded-full bg-neutral-950 px-2.5 py-1 text-xs font-semibold text-white">{turn.score}/100</span></p>
                  <p><span className="font-semibold text-neutral-900">Feedback:</span> {evaluation.feedback}</p>
                </div>;
              })()}
            </div>) : (<div className="mt-4 flex flex-col gap-3">
              <textarea rows={4} value={answers[i] ?? ''} onChange={(e) => setAnswers((prev) => prev.map((a, ai) => (ai === i ? e.target.value : a)))} placeholder="Type your answer…" className="resize-y rounded-lg border border-neutral-200 px-3 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-400"/>
              <div>
                <button type="button" onClick={() => handleAnswer(i)} disabled={busyIndex === i} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-neutral-950 px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60">
                  {busyIndex === i ? (<Loader2 className="h-4 w-4 animate-spin"/>) : (<RotateCcw className="h-4 w-4"/>)}
                  {busyIndex === i ? 'Grading…' : 'Submit answer'}
                </button>
              </div>
            </div>)}
        </AgentCard>))}
    </div>);
}
