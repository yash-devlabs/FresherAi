import { createClient } from '@supabase/supabase-js';

function isNewSupabaseApiKey(value) {
    return value.startsWith('sb_publishable_') || value.startsWith('sb_secret_');
}

function createSupabaseFetch(supabaseKey) {
    return (input, init) => {
        const headers = new Headers(typeof Request !== 'undefined' && input instanceof Request ? input.headers : undefined);
        if (init?.headers) {
            new Headers(init.headers).forEach((value, key) => headers.set(key, value));
        }
        if (isNewSupabaseApiKey(supabaseKey) && headers.get('Authorization') === `Bearer ${supabaseKey}`) {
            headers.delete('Authorization');
        }
        headers.set('apikey', supabaseKey);
        return fetch(input, { ...init, headers });
    };
}

function createSupabaseClient() {
    const SUPABASE_URL = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_SUPABASE_URL : undefined;
    const SUPABASE_PUBLISHABLE_KEY = typeof import.meta !== 'undefined'
        ? (import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env?.VITE_SUPABASE_ANON_KEY)
        : undefined;

    if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
        const missing = [
            ...(!SUPABASE_URL ? ['SUPABASE_URL'] : []),
            ...(!SUPABASE_PUBLISHABLE_KEY ? ['SUPABASE_PUBLISHABLE_KEY'] : []),
        ];
        const message = `Missing Supabase environment variable(s): ${missing.join(', ')}.`;
        console.error(`[Supabase] ${message}`);
        throw new Error(message);
    }

    return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
        global: {
            fetch: createSupabaseFetch(SUPABASE_PUBLISHABLE_KEY),
        },
        auth: {
            storage: typeof window !== 'undefined' ? localStorage : undefined,
            persistSession: true,
            autoRefreshToken: true,
        },
    });
}

let _supabase;

export const supabase = new Proxy({}, {
    get(_, prop, receiver) {
        if (!_supabase) {
            _supabase = createSupabaseClient();
        }
        return Reflect.get(_supabase, prop, receiver);
    },
});

export default supabase;