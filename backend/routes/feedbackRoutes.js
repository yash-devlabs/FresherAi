import { Router } from 'express';
import { z } from 'zod';
import { generateStructured, AIServiceError } from '../ai/aiService.js';
import { analysisSchema, roadmapSchema, questionsSchema, gradeSchema, summarySchema, feedbackSchema, resumeBuildSchema } from '../ai/schemas.js';
import { roadmapRelevantInterviews } from '../services/interviewScore.js';

const router = Router();
const MAX_CONTENT = 30000;
const difficulties = ['easy', 'medium', 'hard'];
const profileColumns = 'id, full_name, degree, college, location, target_role, experience_level, bio, github_url, linkedin_url, portfolio_url, notifications_enabled, ai_model_preference';
const ok = (res, data) => res.json(data);
const fail = (res, message, code = 400) => res.status(code).json({ status: 'error', message });

router.post('/feedback/generate', async (req, res) => {
  const input = z.object({ notes: z.string().optional(), targetRole: z.string().optional() }).parse(req.body);
  const notes = (input.notes || '').trim(), targetRole = (input.targetRole || '').trim(), userId = req.user.id;
  try {
    const [r, i, m] = await Promise.all([
      req.supabase.from('resumes').select('target_role,ats_score,analysis,created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(3),
      req.supabase.from('interviews').select('role,difficulty,status,overall_score,summary,transcript,created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(50),
      req.supabase.from('roadmaps').select('goal,weeks,created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(1),
    ]);
    const failedQuery = [r, i, m].find((result) => result.error);
    if (failedQuery) throw failedQuery.error;
    const resumes = r.data || [], roadmap = m.data?.[0] || null;
    const interviews = roadmapRelevantInterviews(i.data || [], roadmap).slice(0, 10);
    if (!resumes.length && !interviews.length && !roadmap && notes.length < 20) return fail(res, 'There is nothing to review yet. Analyze a resume, finish a mock interview, or add some notes about yourself first.');
    const scores = interviews.map((interview) => interview.overall_score).filter((score) => typeof score === 'number');
    const communicationScore = scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : null;
    const resumeContext = resumes.map((x, n) => `Resume ${n + 1}: ATS ${x.ats_score ?? 'n/a'}/100 for ${x.target_role ?? 'unspecified role'}.\nStrengths: ${x.analysis?.strengths?.join('; ') ?? 'n/a'}\nWeaknesses: ${x.analysis?.weaknesses?.join('; ') ?? 'n/a'}`).join('\n\n');
    const interviewContext = interviews.map((x, n) => `Interview ${n + 1}: ${x.role} (${x.difficulty}) scored ${x.overall_score}/100.\nSummary: ${x.summary ?? 'n/a'}`).join('\n\n');
    const weeks = roadmap?.weeks || [], totalTopics = weeks.reduce((n, week) => n + (week.topics?.length || 0), 0), doneTopics = weeks.reduce((n, week) => n + (week.topics?.filter((topic) => topic.done).length || 0), 0);
    const roadmapContext = roadmap ? `Learning goal: ${roadmap.goal}. Progress: ${doneTopics}/${totalTopics} topics completed across ${weeks.length} weeks.` : 'No learning roadmap generated yet.';
    const generated = await generateStructured({ schema: feedbackSchema, task: 'reasoning', temperature: .4, system: 'You are a placement readiness coach for fresh graduates. Synthesize evidence from resume analyses, mock interviews and learning progress into one honest, encouraging and actionable report. Never invent evidence.', prompt: `Target role: ${targetRole || 'not specified'}\n\nRESUME EVIDENCE:\n${resumeContext || 'No resume analyzed yet.'}\n\nINTERVIEW EVIDENCE:\n${interviewContext || 'No completed mock interviews yet.'}\n\nLEARNING PROGRESS:\n${roadmapContext}\n\nCANDIDATE NOTES:\n${notes || 'None provided.'}\n\nProduce the overall placement readiness report.` });
    const report = { readinessScore: generated.readinessScore, summary: generated.summary, communication: { score: communicationScore, notes: communicationScore === null ? 'Communication score will be available after your first completed mock interview.' : `No separate communication score is recorded. Overall interview score fallback: average of ${scores.length} completed, roadmap-relevant interview${scores.length === 1 ? '' : 's'}.` }, technical: generated.technical, strengths: generated.strengths, improvements: generated.improvements, nextSteps: generated.nextSteps };
    const { data: row, error } = await req.supabase.from('feedback_reports').insert({ user_id: userId, readiness_score: report.readinessScore, report }).select('id').single();
    if (error) throw error;
    await req.supabase.from('activities').insert({ user_id: userId, type: 'feedback', title: 'Readiness Report Generated', subtitle: targetRole ? `Target: ${targetRole}` : 'Overall placement readiness', score: `${report.readinessScore}/100` });
    return ok(res, { status: 'success', reportId: row.id, report });
  } catch (error) {
    console.error(error);
    return fail(res, error instanceof AIServiceError ? error.message : 'Could not generate your feedback report. Please try again.', 500);
  }
});

router.post('/feedback/latest', async (req, res) => {
  try {
    const userId = req.user.id;
    const [reportResult, interviewResult, roadmapResult] = await Promise.all([
      req.supabase.from('feedback_reports').select('id,readiness_score,report,created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      req.supabase.from('interviews').select('role,status,overall_score,transcript,created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(50),
      req.supabase.from('roadmaps').select('goal,weeks').eq('user_id', userId).order('created_at', { ascending: false }).limit(1),
    ]);
    const failedQuery = [reportResult, interviewResult, roadmapResult].find((result) => result.error);
    if (failedQuery) throw failedQuery.error;
    if (!reportResult.data) return ok(res, null);
    const roadmap = roadmapResult.data?.[0] || null;
    const interviews = roadmapRelevantInterviews(interviewResult.data || [], roadmap);
    const scores = interviews.map((interview) => interview.overall_score).filter((score) => typeof score === 'number');
    const report = { ...reportResult.data.report };
    report.communication = {
      score: scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : null,
      notes: scores.length ? `No separate communication score is recorded. Overall interview score fallback: average of ${scores.length} completed, roadmap-relevant interview${scores.length === 1 ? '' : 's'}.` : 'Communication score will be available after your first completed mock interview.',
    };
    return ok(res, { ...reportResult.data, report });
  } catch (error) {
    console.error(error);
    return fail(res, 'Could not load feedback.', 500);
  }
});

export default router;
