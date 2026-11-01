import { Router } from 'express';
import { z } from 'zod';
import { generateStructured, AIServiceError } from '../ai/aiService.js';
import { analysisSchema, roadmapSchema, questionsSchema, gradeSchema, summarySchema, feedbackSchema, resumeBuildSchema } from '../ai/schemas.js';

const router = Router();
const MAX_CONTENT = 30000;
const difficulties = ['easy', 'medium', 'hard'];
const profileColumns = 'id, full_name, degree, college, location, target_role, experience_level, bio, github_url, linkedin_url, portfolio_url, notifications_enabled, ai_model_preference';
const ok = (res, data) => res.json(data);
const fail = (res, message, code = 400) => res.status(code).json({ status: 'error', message });

export const interviewStartSchema = z.object({
  role: z.string(),
  interviewType: z.enum(['technical', 'behavioral']).default('technical'),
  difficulty: z.string().optional(),
  count: z.number().optional(),
});

const interviewInstructions = {
  technical: 'You are a senior software engineering interviewer conducting a mock interview for a fresh graduate. Ask clear, realistic, role-specific technical questions; infer the relevant skills from the job role. Avoid trivia, repetition, and skills unrelated to the role.',
  behavioral: 'You are an experienced behavioral interviewer for a fresh graduate. Ask clear questions about past experience, collaboration, communication, ownership, and problem solving.',
};

const difficultyGuidance = {
  easy: 'Ask about core concepts, basic syntax, fundamental reasoning, or simple code interpretation. Prefer a short concrete snippet or a small familiar task over definition-only questions.',
  medium: 'Require applying concepts: debug a realistic snippet, predict output, choose an implementation or data structure, or solve a practical task. Ask for reasoning, not just a definition.',
  hard: 'Require solving or analyzing a multi-step problem involving edge cases, optimization, deeper reasoning, or design trade-offs. Combine relevant concepts where appropriate and ask the candidate to explain constraints and consequences. Avoid obscure trivia.',
};

export function buildInterviewQuestionPrompt({ count, interviewType, role, difficulty }) {
  return `Generate exactly ${count} distinct ${interviewType} interview questions for the role "${role}" at ${difficulty} difficulty. ${difficultyGuidance[difficulty]} For technical interviews, infer the role's likely languages, frameworks, and core skills, then vary the assessed concepts. Target real internship and fresher interviews: placement coding rounds, college projects, startup feature work, and production application scenarios when relevant, without forcing local references. For Python roles, progress from syntax and simple output traces (easy), through mutable-object behavior, debugging, data-structure choices and practical implementation (medium), to edge cases, complexity, optimization and combined concepts (hard). Adapt examples to other technologies. Behavioral prompts should suit a new graduate's likely projects, study, or team experience. Avoid duplicate concepts, generic filler, trivia, and answers; return only the questions.`;
}

export function buildInterviewGradePrompt({ role, difficulty, question, answer }) {
  return `Evaluate this candidate answer fairly. Consider technical accuracy, relevance, completeness, reasoning, and suitable examples; accept correct explanations expressed in different words. For coding, assess correctness, approach, edge cases, and complexity where relevant. Calibrate expectations to ${difficulty} difficulty for the role of ${role}.\n\nQuestion: ${question}\nCandidate answer: ${answer || '[No answer provided]'}\n\nReturn three fields: verdict (Correct, Partially Correct, Incorrect, or Unanswered), score (0-100), and concise feedback explaining what is correct, what is missing or incorrect, and the essential concept. Award partial credit for valid reasoning; keep score consistent with verdict and feedback. Use 85-100 for substantially correct complete responses, 50-84 for meaningfully partial, 1-49 for mostly incorrect attempts, and 0 for unanswered. Never claim strengths the candidate did not demonstrate.`;
}

export async function startInterview(req, res) {
  const parsed = interviewStartSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, 'Choose a Technical or Behavioral interview type.', 400);

  const input = parsed.data;
  const role = input.role.trim();
  const { interviewType } = input;
  const difficulty = difficulties.includes((input.difficulty || 'medium').trim())
    ? (input.difficulty || 'medium').trim()
    : 'medium';
  const count = Math.min(Math.max(input.count || 5, 3), 8);
  if (role.length < 2) return fail(res, 'Please enter the role you want to interview for.');

  try {
    const { questions } = await generateStructured({
      schema: questionsSchema,
      task: 'reasoning',
      temperature: 0.7,
      system: interviewInstructions[interviewType],
      prompt: buildInterviewQuestionPrompt({ count, interviewType, role, difficulty }),
    });
    const transcript = questions.slice(0, count).map((question) => ({ question }));
    const { data: row, error } = await req.supabase.from('interviews').insert({
      user_id: req.user.id,
      role,
      interview_type: interviewType,
      difficulty,
      status: 'active',
      transcript,
    }).select('id').single();
    if (error) throw error;
    return ok(res, {
      status: 'success',
      session: { id: row.id, role, interviewType, difficulty, status: 'active', transcript, overallScore: null, summary: null },
    });
  } catch (error) {
    console.error(error);
    return fail(res, error instanceof AIServiceError ? error.message : 'Could not start the interview. Please try again.', 500);
  }
}

router.post('/interview/start', startInterview);

router.post('/interview/answer', async(req,res)=>{const input=z.object({interviewId:z.string(),questionIndex:z.number(),answer:z.string()}).parse(req.body);const trimmed=input.answer.trim();try{const {data:row,error}=await req.supabase.from('interviews').select('role,difficulty,status,transcript').eq('id',input.interviewId).maybeSingle();if(error)throw error;if(!row)return ok(res,{ok:false,message:'Interview not found.'});if(row.status!=='active')return ok(res,{ok:false,message:'This interview is already complete.'});const transcript=row.transcript||[],turn=transcript[input.questionIndex];if(!turn)return ok(res,{ok:false,message:'Invalid question.'});const grade=await generateStructured({schema:gradeSchema,task:'reasoning',temperature:.3,system:'You are an expert interviewer and educator grading a candidate answer. Follow the requested rubric precisely. Be fair to valid alternative wording and never infer evidence the candidate did not provide.',prompt:buildInterviewGradePrompt({role:row.role,difficulty:row.difficulty||'medium',question:turn.question,answer:trimmed})});turn.answer=trimmed.slice(0,4000);turn.score=grade.score;turn.feedback=`Verdict: ${grade.verdict}\nFeedback: ${grade.feedback}`;const {error:updateError}=await req.supabase.from('interviews').update({transcript,updated_at:new Date().toISOString()}).eq('id',input.interviewId);if(updateError)throw updateError;return ok(res,{ok:true,turn})}catch(e){console.error(e);return ok(res,{ok:false,message:e instanceof AIServiceError?e.message:'Could not grade your answer. Please try again.'})}});

router.post('/interview/finish', async(req,res)=>{const {interviewId}=z.object({interviewId:z.string()}).parse(req.body);try{const {data:row,error}=await req.supabase.from('interviews').select('role,difficulty,transcript').eq('id',interviewId).maybeSingle();if(error)throw error;if(!row)return ok(res,{ok:false,message:'Interview not found.'});const graded=(row.transcript||[]).filter(t=>typeof t.score==='number');if(!graded.length)return ok(res,{ok:false,message:'Answer at least one question first.'});const overallScore=Math.round(graded.reduce((s,t)=>s+(t.score||0),0)/graded.length);let summary='Interview completed. Review the per-question feedback above to see where you can improve.';try{const result=await generateStructured({schema:summarySchema,task:'reasoning',temperature:.5,system:'You are an interview coach summarizing a mock interview for a fresh graduate. Be encouraging but honest, highlighting strengths and the top areas to improve.',prompt:`Role: ${row.role} (${row.difficulty}). Overall score: ${overallScore}/100.\nTranscript:\n${graded.map((t,i)=>`Q${i+1}: ${t.question}\nAnswer: ${t.answer}\nScore: ${t.score}/100\n`).join('\n')}\nWrite the overall assessment.`});summary=result.summary}catch(e){console.error(e)}const {error:updateError}=await req.supabase.from('interviews').update({status:'completed',overall_score:overallScore,summary,updated_at:new Date().toISOString()}).eq('id',interviewId);if(updateError)throw updateError;await req.supabase.from('activities').insert({user_id:req.user.id,type:'interview',title:'Mock Interview Completed',subtitle:`${row.role} · ${row.difficulty}`,score:`${overallScore}/100`});return ok(res,{ok:true,overallScore,summary})}catch(e){return fail(res,'Could not finish the interview.',500)}});

router.post('/interview/history', async(req,res)=>{try{const {data,error}=await req.supabase.from('interviews').select('id,role,interview_type,difficulty,status,overall_score,created_at').order('created_at',{ascending:false}).limit(10);if(error)throw error;return ok(res,data||[])}catch(e){return fail(res,'Could not load interview history.',500)}});
export default router;
