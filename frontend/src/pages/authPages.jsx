import { AuthForm } from '@/components/auth/auth-form';

export function LoginPage() { return <AuthenticationPage mode="sign-in" />; }
export function SignupPage() { return <AuthenticationPage mode="sign-up" />; }

function AuthenticationPage({ mode }) {
  return <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10"><AuthForm mode={mode} /></div>;
}
