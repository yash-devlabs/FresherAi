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

router.post('/resume/analyze', async (req,res)=>{
  const input=z.object({content:z.string(),fileName:z.string().optional(),targetRole:z.string().optional(),jobDescription:z.string().optional()}).parse(req.body);
  const content=input.content.trim(), fileName=(input.fileName||'resume.txt').trim()||'resume.txt', targetRole=(input.targetRole||'').trim(), jobDescription=(input.jobDescription||'').trim();
  if(content.length<80) return fail(res,'Please paste your full resume text (at least a few lines) so it can be analyzed.');
  try{
    const analysis=await generateStructured({schema:analysisSchema,task:'reasoning',system:'You are a senior technical recruiter, ATS specialist and career consultant with 15 years of campus and lateral hiring experience. Parse resumes objectively. Never invent experience and always tie advice to evidence.',prompt:`Run a full ATS and recruiter analysis of the resume below${targetRole?` for the target role of "${targetRole}"`:''}.\n\n${jobDescription?`JOB DESCRIPTION:\n${jobDescription.slice(0,MAX_CONTENT)}\n\n`:'No job description was supplied. Benchmark against typical requirements for this role.\n\n'}Deliver atsScore, matchPercent, missingKeywords, missingTechnicalSkills, missingSoftSkills, prioritised skillGaps, sectionReview, strengths, weaknesses, suggestions, recruiterPerspective and finalVerdict.\n\nRESUME:\n${content.slice(0,MAX_CONTENT)}`});
    const {data:row,error}=await req.supabase.from('resumes').insert({user_id:req.user.id,file_name:fileName,target_role:targetRole||null,content:content.slice(0,MAX_CONTENT),ats_score:analysis.atsScore,analysis}).select('id').single();
    if(error) throw error;
    await req.supabase.from('activities').insert({user_id:req.user.id,type:'resume',title:'Resume Analyzed',subtitle:targetRole?`Target: ${targetRole}`:'ATS Score Generated',score:`${analysis.atsScore}/100`});
    return ok(res,{status:'success',resumeId:row.id,analysis,fileName});
  }catch(e){ console.error(e); return fail(res,e instanceof AIServiceError?e.message:'Could not analyze your resume. Please try again.',500); }
});


router.post('/resume/build', async(req,res)=>{
  const input=z.object({fullName:z.string(),email:z.string().optional(),phone:z.string().optional(),location:z.string().optional(),links:z.string().optional(),targetRole:z.string().optional(),education:z.string().optional(),skills:z.string().optional(),experience:z.string().optional(),projects:z.string().optional(),achievements:z.string().optional()}).parse(req.body);
  const fullName=input.fullName.trim(); if(fullName.length<2) return fail(res,'Please enter your full name.');
  const details=[['Target role',input.targetRole],['Education',input.education],['Skills',input.skills],['Experience / internships',input.experience],['Projects',input.projects],['Achievements & certifications',input.achievements]].filter(([,v])=>(v||'').trim().length).map(([k,v])=>`${k}:\n${v.trim()}`).join('\n\n');
  if(details.length<40) return fail(res,'Add a little more detail (education, skills or projects) so a meaningful resume can be built.');
  try{ const resume=await generateStructured({schema:resumeBuildSchema,task:'reasoning',temperature:.4,system:'You are an elite resume writer and ex-recruiter. Write concise, ATS-friendly, achievement-oriented content. Never invent employers, dates, degrees, metrics or technologies.',prompt:`Build a polished recruiter-ready resume.\n\nName: ${fullName}\n\n${details.slice(0,MAX_CONTENT)}\n\nTailor the summary to the target role, group skills sensibly, and keep bullets concise.`});
    await req.supabase.from('activities').insert({user_id:req.user.id,type:'resume',title:'Resume Built',subtitle:input.targetRole?.trim()?`Target: ${input.targetRole.trim()}`:'AI-generated resume draft',score:null});
    return ok(res,{status:'success',resume,contact:{fullName,email:(input.email||'').trim(),phone:(input.phone||'').trim(),location:(input.location||'').trim(),links:(input.links||'').trim()}});
  }catch(e){console.error(e);return fail(res,e instanceof AIServiceError?e.message:'Could not build your resume. Please try again.',500);}
});

router.post('/resume/history', async(req,res)=>{try{const {data,error}=await req.supabase.from('resumes').select('id,file_name,target_role,ats_score,analysis,created_at').order('created_at',{ascending:false}).limit(10);if(error)throw error;return ok(res,data||[])}catch(e){return fail(res,'Could not load resume history.',500)}});

router.post('/resume/delete', async(req,res)=>{try{const {id}=z.object({id:z.string()}).parse(req.body);const {error}=await req.supabase.from('resumes').delete().eq('id',id);if(error)throw error;return ok(res,{ok:true})}catch(e){return fail(res,'Could not delete the resume.',500)}});
export default router;
