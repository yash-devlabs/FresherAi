import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useServerFn } from '@/services/useApiFunction';
import { Loader2, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getProfile, updateProfile } from '@/services/profileApi';
import { authClient, useSession } from '@/authentication/supabaseAuth';
import { useAgentSync } from '@/services/refreshAgentData';
import { AgentCard, CardTitle, ErrorBanner } from '@/components/agents/agent-ui';
const MODELS = [
    { value: 'balanced', label: 'Balanced — fastest responses (recommended)' },
    { value: 'quality', label: 'Quality — deeper reasoning, slower' },
];
export function SettingsPanel() {
    const fetchProfile = useServerFn(getProfile);
    const saveProfile = useServerFn(updateProfile);
    const sync = useAgentSync();
    const navigate = useNavigate();
    const { user } = useSession();
    const { data, isLoading, error } = useQuery({
        queryKey: ['profile'],
        queryFn: () => fetchProfile({ data: undefined }),
    });
    const [model, setModel] = useState('balanced');
    useEffect(() => {
        if (data) {
            setModel(data.ai_model_preference || 'balanced');
        }
    }, [data]);
    const mutation = useMutation({
        mutationFn: (values) => saveProfile({ data: values }),
        onSuccess: () => sync(),
    });
    function persist(next) {
        mutation.mutate({ ai_model_preference: next.ai_model_preference ?? model });
    }
    if (isLoading) {
        return (<AgentCard className="flex min-h-[240px] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-neutral-400"/>
      </AgentCard>);
    }
    if (error) {
        return (<AgentCard>
        <ErrorBanner message="Could not load your settings. Please refresh and try again."/>
      </AgentCard>);
    }
    return (<div className="flex flex-col gap-6">
      <AgentCard>
        <CardTitle>Account</CardTitle>
        <dl className="mt-5 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-sm text-neutral-500">Email</dt>
            <dd className="truncate text-sm font-medium text-neutral-900">
              {user?.email ?? '—'}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-sm text-neutral-500">Name</dt>
            <dd className="truncate text-sm font-medium text-neutral-900">
              {data?.full_name?.trim() || 'Not set'}
            </dd>
          </div>
        </dl>
      </AgentCard>

      <AgentCard>
        <CardTitle>Preferences</CardTitle>

        <div className="mt-5 flex flex-col gap-1.5">
          <label htmlFor="ai_model_preference" className="text-sm font-medium text-neutral-900">
            AI response style
          </label>
          <p className="text-sm text-neutral-500">
            Applies to every agent when generating your results.
          </p>
          <select id="ai_model_preference" value={model} onChange={(e) => {
            setModel(e.target.value);
            persist({ ai_model_preference: e.target.value });
        }} className="mt-2 rounded-lg border border-neutral-200 px-3 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-400">
            {MODELS.map((m) => (<option key={m.value} value={m.value}>
                {m.label}
              </option>))}
          </select>
        </div>

        {mutation.data?.status === 'error' && (<div className="mt-5">
            <ErrorBanner message={mutation.data.message}/>
          </div>)}
      </AgentCard>

      <AgentCard>
        <CardTitle>Session</CardTitle>
        <p className="mt-1.5 text-sm text-neutral-500">
          Sign out of FresherAI on this device.
        </p>
        <button type="button" onClick={async () => {
            await authClient.signOut();
            void navigate('/login');
        }} className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-neutral-200 px-5 py-2.5 text-sm font-medium text-neutral-900 transition-colors hover:border-neutral-900">
          <LogOut className="h-4 w-4"/> Sign out
        </button>
      </AgentCard>
    </div>);
}
