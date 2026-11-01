import { useState } from 'react';
import { useRouter } from '@/routing/navigation';
import Link from '@/routing/link';
import { Loader2, Mail, Lock, User } from 'lucide-react';
import { authClient } from '@/authentication/supabaseAuth';
import { Button } from '@/components/ui/button';
import { BrandLogo } from '@/components/brand/brand-logo';
export function AuthForm({ mode }) {
    const router = useRouter();
    const isSignUp = mode === 'sign-up';
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [confirmSent, setConfirmSent] = useState(false);
    async function handleSubmit(e) {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            if (isSignUp) {
                const { error, needsEmailConfirmation } = await authClient.signUp.email({
                    email,
                    password,
                    name,
                });
                if (error)
                    throw new Error(error.message || 'Could not create account');
                if (needsEmailConfirmation) {
                    setConfirmSent(true);
                    setLoading(false);
                    return;
                }
            }
            else {
                const { error } = await authClient.signIn.email({ email, password });
                if (error)
                    throw new Error(error.message || 'Invalid email or password');
            }
            router.push('/dashboard');
            router.refresh();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
            setLoading(false);
        }
    }
    return (<div className="w-full max-w-md">
      <div className="mb-8 flex justify-center">
        <BrandLogo withTagline markSize={44}/>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-xl sm:p-8">
        {confirmSent ? (<div className="text-center">
            <h1 className="font-display text-2xl font-bold tracking-tight text-card-foreground">
              Confirm your email
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              We sent a confirmation link to{' '}
              <span className="font-medium text-foreground">{email}</span>. Open
              it to activate your account, then sign in.
            </p>
            <Link href="/login" className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-gold px-6 text-sm font-semibold text-[oklch(0.2_0.02_84)] transition-opacity hover:opacity-90">
              Go to sign in
            </Link>
          </div>) : (<>
        <div className="mb-6 text-center">
          <h1 className="font-display text-2xl font-bold tracking-tight text-card-foreground">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {isSignUp
                ? 'Start preparing for your dream placement.'
                : 'Sign in to continue your prep journey.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {isSignUp && (<Field id="name" label="Full name" icon={<User className="size-4" aria-hidden/>}>
              <input id="name" type="text" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Aisha Sharma" className="w-full bg-transparent py-2.5 pr-3 pl-10 text-sm text-foreground outline-none placeholder:text-muted-foreground/60"/>
            </Field>)}

          <Field id="email" label="Email" icon={<Mail className="size-4" aria-hidden/>}>
            <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full bg-transparent py-2.5 pr-3 pl-10 text-sm text-foreground outline-none placeholder:text-muted-foreground/60"/>
          </Field>

          <Field id="password" label="Password" icon={<Lock className="size-4" aria-hidden/>}>
            <input id="password" type="password" required minLength={8} autoComplete={isSignUp ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={isSignUp ? 'At least 8 characters' : '••••••••'} className="w-full bg-transparent py-2.5 pr-3 pl-10 text-sm text-foreground outline-none placeholder:text-muted-foreground/60"/>
          </Field>

          {error && (<p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>)}

          <Button type="submit" size="lg" disabled={loading} className="mt-1 w-full bg-gold text-[oklch(0.2_0.02_84)] hover:bg-gold/90">
            {loading && <Loader2 className="size-4 animate-spin" aria-hidden/>}
            {isSignUp ? 'Create account' : 'Sign in'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <Link href={isSignUp ? '/login' : '/signup'} className="font-medium text-gold underline-offset-4 hover:underline">
            {isSignUp ? 'Sign in' : 'Sign up'}
          </Link>
        </p>
        </>)}
      </div>
    </div>);
}
function Field({ id, label, icon, children, }) {
    return (<div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="relative flex items-center rounded-lg border border-input bg-background/40 transition-colors focus-within:border-gold/60 focus-within:ring-3 focus-within:ring-gold/20">
        <span className="pointer-events-none absolute left-3 text-muted-foreground">
          {icon}
        </span>
        {children}
      </div>
    </div>);
}
