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

function buildRecommendations({ resume, interviews, roadmap, feedback, activities }) {
  const steps = [];
  const weeks = Array.isArray(roadmap?.weeks) ? roadmap.weeks : [];
  let nextTopic = null;

  for (let weekIndex = 0; weekIndex < weeks.length && !nextTopic; weekIndex += 1) {
    const week = weeks[weekIndex];
    const topics = Array.isArray(week.topics) ? week.topics : [];
    const topicIndex = topics.findIndex((topic) => !topic.done);
    if (topicIndex >= 0) nextTopic = { week, topic: topics[topicIndex] };
  }

  if (!roadmap) {
    steps.push({ title: 'Create your career roadmap', subtitle: 'Build a weekly learning plan for your target role.', tag: 'Roadmap', href: '/roadmap' });
  } else if (nextTopic) {
    const weekLabel = nextTopic.week.title || `Week ${nextTopic.week.week || weeks.indexOf(nextTopic.week) + 1}`;
    steps.push({ title: 'Continue your learning roadmap', subtitle: `${weekLabel}: ${nextTopic.topic.name}`, tag: 'Roadmap', href: '/roadmap' });
  } else {
    steps.push({ title: 'Plan your next learning goal', subtitle: `${roadmap.goal} roadmap complete. Choose what to learn next.`, tag: 'Roadmap', href: '/roadmap' });
  }

  const score = resume?.ats_score;
  const skillGap = resume?.analysis?.skillGaps?.[0]?.skill || resume?.analysis?.missingTechnicalSkills?.[0];
  if (!resume) {
    steps.push({ title: 'Analyze your resume', subtitle: 'Get an ATS score and role-specific improvement ideas.', tag: 'Resume', href: '/resume' });
  } else if (typeof score === 'number' && score < 70) {
    steps.push({ title: 'Improve your resume ATS score', subtitle: `Your latest score is ${score}/100${skillGap ? `; start with ${skillGap}.` : '. Review the suggested improvements.'}`, tag: 'Resume', href: '/resume' });
  } else if (skillGap) {
    steps.push({ title: 'Strengthen a resume skill gap', subtitle: `Add evidence for ${skillGap} in your resume or projects.`, tag: 'Resume', href: '/resume' });
  } else {
    steps.push({ title: 'Tailor your resume for your target role', subtitle: 'Review your latest analysis and update your resume as needed.', tag: 'Resume', href: '/resume' });
  }

  const latestInterview = interviews[0];
  if (!latestInterview) {
    steps.push({ title: 'Practice a mock interview', subtitle: 'Try a role-specific session and get feedback on your answers.', tag: 'Interview', href: '/interview' });
  } else {
    const interviewScore = latestInterview.overall_score;
    const role = latestInterview.role || 'your target role';
    steps.push({
      title: interviewScore !== null && interviewScore < 70 ? 'Practice to improve your interview score' : 'Keep your interview skills sharp',
      subtitle: typeof interviewScore === 'number' ? `Your latest ${role} interview scored ${interviewScore}/100. Practice again and review the feedback.` : `Complete another ${role} mock interview to keep building confidence.`,
      tag: 'Interview',
      href: '/interview',
    });
  }

  const latestRelevantActivity = activities.find((activity) => ['resume', 'interview', 'roadmap'].includes(activity.type));
  const evidenceTimes = [resume?.created_at, latestInterview?.created_at, roadmap?.updated_at, roadmap?.created_at, latestRelevantActivity?.created_at]
    .map((value) => value ? Date.parse(value) : NaN)
    .filter(Number.isFinite);
  const latestEvidenceTime = Math.max(0, ...evidenceTimes);
  const feedbackTime = feedback?.created_at ? Date.parse(feedback.created_at) : NaN;
  if (!feedback) {
    steps.push({ title: 'Generate your readiness report', subtitle: 'Get an overview of your resume, interview, and learning progress.', tag: 'Readiness', href: '/feedback' });
  } else if (Number.isFinite(feedbackTime) && latestEvidenceTime > feedbackTime) {
    steps.push({ title: 'Refresh your readiness report', subtitle: 'Your resume, interview, or roadmap has changed since your last report.', tag: 'Recent progress', href: '/feedback' });
  }

  return steps;
}

router.post('/dashboard', async (req, res) => {
  const db = req.supabase, userId = req.user.id;
  try {
    const results = await Promise.all([
      db.from('resumes').select('ats_score, target_role, analysis, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      db.from('interviews').select('role, status, overall_score, transcript, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(50),
      db.from('roadmaps').select('goal, weeks, created_at, updated_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      db.from('feedback_reports').select('readiness_score, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      db.from('activities').select('id, type, title, subtitle, score, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(8),
      db.from('profiles').select(profileColumns).eq('id', userId).maybeSingle(),
    ]);
    const failedQuery = results.find((result) => result.error);
    if (failedQuery) throw failedQuery.error;
    const [resumeRes, interviewRes, roadmapRes, feedbackRes, activityRes, profileRes] = results;
    const relevant = roadmapRelevantInterviews(interviewRes.data || [], roadmapRes.data);
    const interviewScores = relevant.map(x => x.overall_score).filter(x => typeof x === 'number');
    const weeks = roadmapRes.data?.weeks || [];
    const totalTopics = weeks.reduce((n, w) => n + (w.topics?.length || 0), 0);
    const doneTopics = weeks.reduce((n, w) => n + (w.topics?.filter(t => t.done).length || 0), 0);
    const recommendations = buildRecommendations({ resume: resumeRes.data, interviews: relevant, roadmap: roadmapRes.data, feedback: feedbackRes.data, activities: activityRes.data || [] });
    return ok(res, { stats: {
      resumeScore: resumeRes.data?.ats_score ?? null,
      interviewScore: interviewScores.length ? Math.round(interviewScores.reduce((a,b)=>a+b,0)/interviewScores.length) : null,
      roadmapProgress: totalTopics ? Math.round(doneTopics / totalTopics * 100) : null,
      readinessScore: feedbackRes.data?.readiness_score ?? null,
      interviewCount: interviewScores.length,
    }, recommendations, activities: activityRes.data || [], profile: profileRes.data || null });
  } catch (e) { console.error(e); return fail(res, 'Could not load your dashboard.', 500); }
});
// Export the dashboard router so the server can use these routes.
export default router;
