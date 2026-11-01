import { useFormStatus } from 'react-dom';
import { Loader2, AlertCircle, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
/** White rounded panel used across every agent screen. */
export function AgentCard({ className, children, }) {
    return (<section className={cn('rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-7', className)}>
      {children}
    </section>);
}
export function CardTitle({ children }) {
    return (<h2 className="font-display text-lg font-bold text-neutral-900">
      {children}
    </h2>);
}
/** Circular score meter, colored by band. */
export function ScoreRing({ value, max = 100, label, suffix = '', }) {
    const pct = Math.max(0, Math.min(100, (value / max) * 100));
    const band = pct >= 75 ? '#16a34a' : pct >= 50 ? '#d97706' : '#dc2626';
    return (<div className="flex flex-col items-center gap-2">
      <div className="relative flex h-28 w-28 items-center justify-center rounded-full" style={{
            background: `conic-gradient(${band} ${pct * 3.6}deg, #e5e5e5 0deg)`,
        }} role="img" aria-label={`${label}: ${value}${suffix}`}>
        <div className="flex h-[88px] w-[88px] flex-col items-center justify-center rounded-full bg-white">
          <span className="font-display text-2xl font-bold text-neutral-900">
            {value}
            <span className="text-sm text-neutral-400">{suffix}</span>
          </span>
        </div>
      </div>
      <span className="text-sm font-medium text-neutral-500">{label}</span>
    </div>);
}
/** Bulleted list with positive / negative / neutral markers. */
export function MarkerList({ items, tone, }) {
    const Icon = tone === 'positive' ? Check : tone === 'negative' ? X : AlertCircle;
    const color = tone === 'positive'
        ? 'text-green-600'
        : tone === 'negative'
            ? 'text-red-600'
            : 'text-amber-600';
    return (<ul className="flex flex-col gap-2.5">
      {items.map((item, i) => (<li key={i} className="flex items-start gap-2.5 text-sm text-neutral-700">
          <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', color)} strokeWidth={2.2}/>
          <span className="leading-relaxed">{item}</span>
        </li>))}
    </ul>);
}
export function ErrorBanner({ message }) {
    return (<p role="alert" className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      <AlertCircle className="h-4 w-4 shrink-0"/>
      {message}
    </p>);
}
/** Submit button wired to the parent <form> pending state. */
export function SubmitButton({ children, pendingLabel, disabled, className, }) {
    const { pending } = useFormStatus();
    return (<button type="submit" disabled={pending || disabled} className={cn('inline-flex h-12 items-center justify-center gap-2 rounded-full bg-neutral-950 px-6 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60', className)}>
      {pending && <Loader2 className="h-4 w-4 animate-spin"/>}
      {pending ? pendingLabel : children}
    </button>);
}
