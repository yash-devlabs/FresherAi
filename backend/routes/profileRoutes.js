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

router.post('/profile/get', async (req,res) => {
  try {
    const { data, error } = await req.supabase.from('profiles').select(profileColumns).eq('id', req.user.id).maybeSingle();
    if (error) throw error;
    if (data) return ok(res,data);
    const { data: created, error: insertError } = await req.supabase.from('profiles').insert({ id:req.user.id, full_name:req.user.user_metadata?.full_name || '' }).select(profileColumns).single();
    if (insertError) throw insertError;
    return ok(res,created);
  } catch(e){ console.error(e); return fail(res,'Could not load your profile.',500); }
});

const nullableText = z.string().max(2000).optional().transform(v => { const t=(v||'').trim(); return t.length?t:null; });
const ProfileInput = z.object({ full_name:z.string().max(120).optional(), degree:nullableText, college:nullableText, location:nullableText, target_role:nullableText, experience_level:z.string().max(40).optional(), bio:nullableText, github_url:nullableText, linkedin_url:nullableText, portfolio_url:nullableText, notifications_enabled:z.boolean().optional(), ai_model_preference:z.string().max(40).optional() });

router.post('/profile/update', async (req,res)=>{
  try {
    const data = ProfileInput.parse(req.body); const patch={updated_at:new Date().toISOString()};
    for(const [k,v] of Object.entries(data)){ if(v!==undefined) patch[k]=k==='full_name'&&typeof v==='string'?v.trim():v; }
    const {data:row,error}=await req.supabase.from('profiles').update(patch).eq('id',req.user.id).select(profileColumns).maybeSingle();
    if(error) throw error;
    if(row) return ok(res,{status:'success',profile:row});
    const {data:created,error:insertError}=await req.supabase.from('profiles').insert({id:req.user.id,full_name:'',...patch}).select(profileColumns).single();
    if(insertError) throw insertError; return ok(res,{status:'success',profile:created});
  }catch(e){ console.error(e); return fail(res,'Could not save your profile. Please try again.'); }
});
export default router;
