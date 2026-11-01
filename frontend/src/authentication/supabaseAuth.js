import { useEffect, useState } from "react";
import { supabase } from "@/database/supabaseClient";
/**
 * Thin auth facade over Lovable Cloud auth, keeping the shape the app's
 * screens already use (`signUp.email`, `signIn.email`, `signOut`).
 */
export const authClient = {
    signUp: {
        async email({ email, password, name, }) {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/dashboard`,
                    data: { full_name: name ?? "" },
                },
            });
            return {
                error: error ? { message: error.message } : null,
                needsEmailConfirmation: !error && !data.session,
            };
        },
    },
    signIn: {
        async email({ email, password }) {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            return { error: error ? { message: error.message } : null };
        },
    },
    async signOut() {
        await supabase.auth.signOut();
    },
};
export const { signIn, signUp, signOut } = authClient;
/** Subscribes to the current auth session. */
export function useSession() {
    const [state, setState] = useState({
        session: null,
        user: null,
        loading: true,
    });
    useEffect(() => {
        const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
            setState({ session, user: session?.user ?? null, loading: false });
        });
        supabase.auth.getSession().then(({ data }) => {
            setState({ session: data.session, user: data.session?.user ?? null, loading: false });
        });
        return () => subscription.subscription.unsubscribe();
    }, []);
    return state;
}
/** Display name for a Cloud auth user. */
export function displayName(user) {
    return (user?.user_metadata?.["full_name"] ||
        user?.email?.split("@")[0] ||
        "there");
}
