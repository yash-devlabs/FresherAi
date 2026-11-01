import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useServerFn } from '@/services/useApiFunction';
import { Loader2, Check } from 'lucide-react';
import { getProfile, updateProfile } from '@/services/profileApi';
import { useAgentSync } from '@/services/refreshAgentData';
import { AgentCard, CardTitle, ErrorBanner } from '@/components/agents/agent-ui';
const EXPERIENCE_LEVELS = [
    { value: 'fresher', label: 'Fresher / Final year' },
    { value: 'intern', label: 'Internship experience' },
    { value: 'junior', label: '0–2 years experience' },
    { value: 'switcher', label: 'Switching careers' },
];
const inputClass = 'rounded-lg border border-neutral-200 px-3 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-400';
function Field({ label, htmlFor, children, }) {
    return (<div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-neutral-700">
        {label}
      </label>
      {children}
    </div>);
}
const EMPTY = {
    full_name: '',
    degree: '',
    college: '',
    location: '',
    target_role: '',
    experience_level: 'fresher',
    bio: '',
    github_url: '',
    linkedin_url: '',
    portfolio_url: '',
};
function toForm(p) {
    return {
        full_name: p.full_name ?? '',
        degree: p.degree ?? '',
        college: p.college ?? '',
        location: p.location ?? '',
        target_role: p.target_role ?? '',
        experience_level: p.experience_level || 'fresher',
        bio: p.bio ?? '',
        github_url: p.github_url ?? '',
        linkedin_url: p.linkedin_url ?? '',
        portfolio_url: p.portfolio_url ?? '',
    };
}
export function ProfileForm() {
    const fetchProfile = useServerFn(getProfile);
    const saveProfile = useServerFn(updateProfile);
    const sync = useAgentSync();
    const { data, isLoading, error } = useQuery({
        queryKey: ['profile'],
        queryFn: () => fetchProfile({ data: undefined }),
    });
    const [form, setForm] = useState(EMPTY);
    const [saved, setSaved] = useState(false);
    useEffect(() => {
        if (data)
            setForm(toForm(data));
    }, [data]);
    const mutation = useMutation({
        mutationFn: (values) => saveProfile({ data: values }),
        onSuccess: (result) => {
            if (result.status === 'success') {
                setSaved(true);
                sync();
                setTimeout(() => setSaved(false), 2500);
            }
        },
    });
    function set(key, value) {
        setForm((f) => ({ ...f, [key]: value }));
    }
    if (isLoading) {
        return (<AgentCard className="flex min-h-[280px] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-neutral-400"/>
      </AgentCard>);
    }
    if (error) {
        return (<AgentCard>
        <ErrorBanner message="Could not load your profile. Please refresh and try again."/>
      </AgentCard>);
    }
    const result = mutation.data;
    return (<form onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate(form);
        }} className="flex flex-col gap-6">
      <AgentCard>
        <CardTitle>Personal details</CardTitle>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Full name" htmlFor="full_name">
            <input id="full_name" value={form.full_name} onChange={(e) => set('full_name', e.target.value)} className={inputClass} placeholder="Your name"/>
          </Field>
          <Field label="Location" htmlFor="location">
            <input id="location" value={form.location} onChange={(e) => set('location', e.target.value)} className={inputClass} placeholder="City, Country"/>
          </Field>
          <Field label="Degree" htmlFor="degree">
            <input id="degree" value={form.degree} onChange={(e) => set('degree', e.target.value)} className={inputClass} placeholder="B.Tech · Computer Science"/>
          </Field>
          <Field label="College" htmlFor="college">
            <input id="college" value={form.college} onChange={(e) => set('college', e.target.value)} className={inputClass} placeholder="Your college or university"/>
          </Field>
          <Field label="Target role" htmlFor="target_role">
            <input id="target_role" value={form.target_role} onChange={(e) => set('target_role', e.target.value)} className={inputClass} placeholder="e.g. Full Stack Developer"/>
          </Field>
          <Field label="Experience level" htmlFor="experience_level">
            <select id="experience_level" value={form.experience_level} onChange={(e) => set('experience_level', e.target.value)} className={inputClass}>
              {EXPERIENCE_LEVELS.map((l) => (<option key={l.value} value={l.value}>
                  {l.label}
                </option>))}
            </select>
          </Field>
        </div>

        <div className="mt-4">
          <Field label="Bio (optional)" htmlFor="bio">
            <textarea id="bio" rows={4} value={form.bio} onChange={(e) => set('bio', e.target.value)} className={`${inputClass} resize-y`} placeholder="A short summary of who you are and what you want to build."/>
          </Field>
        </div>
      </AgentCard>

      <AgentCard>
        <CardTitle>Links</CardTitle>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="GitHub" htmlFor="github_url">
            <input id="github_url" value={form.github_url} onChange={(e) => set('github_url', e.target.value)} className={inputClass} placeholder="github.com/username"/>
          </Field>
          <Field label="LinkedIn" htmlFor="linkedin_url">
            <input id="linkedin_url" value={form.linkedin_url} onChange={(e) => set('linkedin_url', e.target.value)} className={inputClass} placeholder="linkedin.com/in/username"/>
          </Field>
          <Field label="Portfolio" htmlFor="portfolio_url">
            <input id="portfolio_url" value={form.portfolio_url} onChange={(e) => set('portfolio_url', e.target.value)} className={inputClass} placeholder="yoursite.com"/>
          </Field>
        </div>
      </AgentCard>

      {result?.status === 'error' && <ErrorBanner message={result.message}/>}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={mutation.isPending} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-neutral-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 disabled:opacity-60">
          {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin"/>}
          {mutation.isPending ? 'Saving…' : 'Save profile'}
        </button>
        {saved && (<span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-600">
            <Check className="h-4 w-4"/> Saved
          </span>)}
      </div>
    </form>);
}
