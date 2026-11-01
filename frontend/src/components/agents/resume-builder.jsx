import { useState, useTransition } from 'react';
import { Download, FileDown, Loader2, Sparkles } from 'lucide-react';
import { useServerFn } from '@/services/useApiFunction';
import { buildResume } from '@/services/resumeApi';
import { useAgentSync } from '@/services/refreshAgentData';
import { AgentCard, CardTitle, ErrorBanner } from './agent-ui';
const FIELDS = [
    { name: 'education', label: 'Education', rows: 3, placeholder: 'B.Tech CSE, ABC University, 2022–2026, CGPA 8.4' },
    { name: 'skills', label: 'Skills', rows: 2, placeholder: 'React, TypeScript, Node.js, SQL, Git…' },
    { name: 'experience', label: 'Experience / internships', rows: 4, placeholder: 'Frontend Intern at XYZ (Jun–Aug 2025) — built…' },
    { name: 'projects', label: 'Projects', rows: 4, placeholder: 'FresherAI — AI placement assistant built with…' },
    { name: 'achievements', label: 'Achievements & certifications', rows: 3, placeholder: 'AWS Cloud Practitioner, Smart India Hackathon finalist…' },
];
export function ResumeBuilder() {
    const run = useServerFn(buildResume);
    const sync = useAgentSync();
    const [pending, startTransition] = useTransition();
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);
    const [downloading, setDownloading] = useState(false);
    function handleSubmit(e) {
        e.preventDefault();
        setError(null);
        const fd = new FormData(e.currentTarget);
        const payload = Object.fromEntries([...fd.entries()].map(([k, v]) => [k, String(v)]));
        startTransition(async () => {
            try {
                const res = await run({ data: payload });
                if (res.status === 'success') {
                    setResult({ resume: res.resume, contact: res.contact });
                    sync();
                }
                else if (res.status === 'error') {
                    setError(res.message);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Could not build your resume. Please try again.');
            }
        });
    }
    async function handleDownload() {
        if (!result)
            return;
        setDownloading(true);
        try {
            const { downloadResumePdf } = await import('@/lib/resume-pdf');
            downloadResumePdf(result.resume, result.contact);
        }
        catch (err) {
            console.error('[fresherai] resume pdf failed', err);
            setError('Could not generate the PDF. Please try again.');
        }
        finally {
            setDownloading(false);
        }
    }
    return (<div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      <div className="lg:col-span-2">
        <AgentCard>
          <CardTitle>Build your resume</CardTitle>
          <p className="mt-1.5 text-sm text-neutral-500">
            Enter your details. AI writes an ATS-friendly resume you can download
            as a PDF.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field name="fullName" label="Full name" required placeholder="Aarav Sharma"/>
              <Field name="targetRole" label="Target role" placeholder="Frontend Developer"/>
              <Field name="email" label="Email" placeholder="you@email.com"/>
              <Field name="phone" label="Phone" placeholder="+91 90000 00000"/>
              <Field name="location" label="Location" placeholder="Bengaluru, India"/>
              <Field name="links" label="Links" placeholder="github.com/you · linkedin.com/in/you"/>
            </div>

            {FIELDS.map((f) => (<div key={f.name} className="flex flex-col gap-1.5">
                <label htmlFor={f.name} className="text-sm font-medium text-neutral-700">
                  {f.label}
                </label>
                <textarea id={f.name} name={f.name} rows={f.rows} placeholder={f.placeholder} className="resize-y rounded-lg border border-neutral-200 px-3 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-400"/>
              </div>))}

            {error && <ErrorBanner message={error}/>}

            <div>
              <button type="submit" disabled={pending} className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-neutral-950 px-6 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60">
                {pending ? <Loader2 className="h-4 w-4 animate-spin"/> : <Sparkles className="h-4 w-4"/>}
                {pending ? 'Writing your resume…' : 'Generate resume'}
              </button>
            </div>
          </form>
        </AgentCard>
      </div>

      <div className="lg:col-span-3">
        {result ? (<AgentCard>
            <div className="flex items-center justify-between gap-4">
              <CardTitle>Your resume</CardTitle>
              <button type="button" onClick={handleDownload} disabled={downloading} className="inline-flex h-10 items-center gap-2 rounded-full border border-neutral-200 px-4 text-sm font-medium text-neutral-900 transition-colors hover:border-neutral-900 disabled:opacity-60">
                {downloading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Download className="h-4 w-4"/>}
                Download PDF
              </button>
            </div>
            <ResumePreview resume={result.resume} contact={result.contact}/>
          </AgentCard>) : (<AgentCard className="flex h-full min-h-[320px] flex-col items-center justify-center text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-500">
              <FileDown className="h-6 w-6"/>
            </span>
            <p className="mt-4 max-w-xs text-sm text-neutral-500">
              Your generated resume will appear here, ready to download as a PDF.
            </p>
          </AgentCard>)}
      </div>
    </div>);
}
function Field({ name, label, placeholder, required, }) {
    return (<div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-medium text-neutral-700">
        {label}
      </label>
      <input id={name} name={name} required={required} placeholder={placeholder} className="rounded-lg border border-neutral-200 px-3 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-400"/>
    </div>);
}
function Section({ title, children }) {
    return (<section className="mt-6">
      <h3 className="border-b border-neutral-200 pb-1 text-xs font-bold uppercase tracking-widest text-neutral-500">
        {title}
      </h3>
      <div className="mt-3 flex flex-col gap-3 text-sm text-neutral-700">{children}</div>
    </section>);
}
function ResumePreview({ resume, contact }) {
    const contactLine = [contact.email, contact.phone, contact.location, contact.links]
        .filter(Boolean)
        .join('  ·  ');
    return (<div className="mt-5 rounded-2xl border border-neutral-200 bg-white p-6">
      <h2 className="font-display text-2xl font-bold text-neutral-900">{contact.fullName}</h2>
      <p className="text-sm font-medium text-neutral-600">{resume.headline}</p>
      {contactLine && <p className="mt-1 text-xs text-neutral-500">{contactLine}</p>}

      <Section title="Summary">
        <p className="leading-relaxed">{resume.summary}</p>
      </Section>

      {resume.skills.length > 0 && (<Section title="Skills">
          <div className="flex flex-wrap gap-2">
            {resume.skills.map((s) => (<span key={s} className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
                {s}
              </span>))}
          </div>
        </Section>)}

      {resume.experience.length > 0 && (<Section title="Experience">
          {resume.experience.map((e, i) => (<div key={i}>
              <p className="font-semibold text-neutral-900">
                {e.title} — {e.organization}
              </p>
              <p className="text-xs text-neutral-500">{e.period}</p>
              <ul className="mt-1.5 list-disc pl-5">
                {e.bullets.map((b, j) => (<li key={j} className="leading-relaxed">{b}</li>))}
              </ul>
            </div>))}
        </Section>)}

      {resume.projects.length > 0 && (<Section title="Projects">
          {resume.projects.map((p, i) => (<div key={i}>
              <p className="font-semibold text-neutral-900">{p.name}</p>
              <p className="leading-relaxed">{p.description}</p>
              {p.tech.length > 0 && (<p className="mt-0.5 text-xs text-neutral-500">{p.tech.join(', ')}</p>)}
            </div>))}
        </Section>)}

      {resume.education.length > 0 && (<Section title="Education">
          {resume.education.map((e, i) => (<div key={i}>
              <p className="font-semibold text-neutral-900">{e.degree}</p>
              <p className="text-xs text-neutral-500">
                {e.institution} · {e.period}
              </p>
            </div>))}
        </Section>)}

      {resume.certifications.length > 0 && (<Section title="Certifications & achievements">
          <ul className="list-disc pl-5">
            {resume.certifications.map((c, i) => (<li key={i}>{c}</li>))}
          </ul>
        </Section>)}
    </div>);
}
