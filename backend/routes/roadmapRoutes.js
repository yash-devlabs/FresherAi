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

router.post('/roadmap/generate', async(req,res)=>{const input=z.object({goal:z.string(),currentLevel:z.string().optional(),weeks:z.number().optional()}).parse(req.body);const goal=input.goal.trim(), currentLevel=(input.currentLevel||'beginner').trim(), weeksCount=Math.min(Math.max(input.weeks||8,2),16);if(goal.length<3)return fail(res,'Please describe your goal (e.g. "Become a Full Stack Developer").');try{const result=await generateStructured({schema:roadmapSchema,task:'reasoning',temperature:.5,system:'You are a senior career mentor who designs realistic week-by-week learning roadmaps for fresh graduates preparing for placements. Order topics so each week builds on the last.',prompt:`Create a ${weeksCount}-week learning roadmap for someone whose goal is "${goal}" and current level is "${currentLevel}". Produce exactly ${weeksCount} weeks. Each week needs a clear focus, 3-6 topics (done false), and 1-4 concrete resources.`});const weeks=result.weeks.slice(0,weeksCount);const {data:row,error}=await req.supabase.from('roadmaps').insert({user_id:req.user.id,goal,current_level:currentLevel,duration_weeks:weeks.length,overview:result.overview,weeks}).select('id').single();if(error)throw error;await req.supabase.from('activities').insert({user_id:req.user.id,type:'roadmap',title:'Roadmap Generated',subtitle:goal,score:`${weeks.length} wks`});return ok(res,{status:'success',roadmapId:row.id,goal,overview:result.overview,weeks});}catch(e){console.error(e);return fail(res,e instanceof AIServiceError?e.message:'Could not generate your roadmap. Please try again.',500)}});

router.post('/roadmap/toggle', async(req,res)=>{try{const input=z.object({roadmapId:z.string(),weekIndex:z.number(),topicIndex:z.number()}).parse(req.body);const {data:row,error}=await req.supabase.from('roadmaps').select('weeks').eq('id',input.roadmapId).maybeSingle();if(error)throw error;if(!row)return ok(res,{ok:false});const weeks=row.weeks||[];const topic=weeks[input.weekIndex]?.topics?.[input.topicIndex];if(!topic)return ok(res,{ok:false});topic.done=!topic.done;const {error:updateError}=await req.supabase.from('roadmaps').update({weeks,updated_at:new Date().toISOString()}).eq('id',input.roadmapId);if(updateError)throw updateError;return ok(res,{ok:true,weeks})}catch(e){return fail(res,'Could not update roadmap progress.',500)}});

router.post('/roadmap/latest', async(req,res)=>{try{const {data,error}=await req.supabase.from('roadmaps').select('id,goal,overview,weeks,current_level,created_at').order('created_at',{ascending:false}).limit(1).maybeSingle();if(error)throw error;return ok(res,data||null)}catch(e){return fail(res,'Could not load roadmap.',500)}});
export default router;
