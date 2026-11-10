'use client';

import { forwardRef, useState } from 'react';
import { AlertCircle, Check, Eye, EyeOff, Loader2, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Field({ id, label, error, hint, children }: { id: string; label: string; error?: string; hint?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-[13px] font-medium text-zinc-700">{label}</label>
        {hint}
      </div>
      {children}
      {error && <p id={`${id}-error`} className="flex items-center gap-1.5 text-xs text-red-600"><AlertCircle className="h-3.5 w-3.5" />{error}</p>}
    </div>
  );
}

type IconInputProps = React.ComponentProps<'input'> & { icon: React.ElementType; invalid?: boolean; trailing?: React.ReactNode };

export const IconInput = forwardRef<HTMLInputElement, IconInputProps>(({ icon: Icon, invalid, trailing, className, id, ...props }, ref) => (
  <div className="group relative">
    <Icon className={cn('pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors', invalid ? 'text-red-500' : 'text-zinc-400 group-focus-within:text-zinc-900')} />
    <input
      ref={ref}
      id={id}
      aria-invalid={invalid || undefined}
      aria-describedby={invalid ? `${id}-error` : undefined}
      className={cn(
        'h-11 w-full rounded-xl border bg-white pl-10 pr-3.5 text-sm text-zinc-900 shadow-[0_1px_2px_rgba(16,24,40,0.04)] outline-none transition-all placeholder:text-zinc-400',
        'focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/[0.06]',
        invalid ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10' : 'border-zinc-200 hover:border-zinc-300',
        trailing && 'pr-11',
        className,
      )}
      {...props}
    />
    {trailing && <div className="absolute right-1.5 top-1/2 -translate-y-1/2">{trailing}</div>}
  </div>
));
IconInput.displayName = 'IconInput';

export const PasswordInput = forwardRef<HTMLInputElement, Omit<IconInputProps, 'icon' | 'type' | 'trailing'>>((props, ref) => {
  const [show, setShow] = useState(false);
  return (
    <IconInput
      ref={ref}
      icon={Lock}
      type={show ? 'text' : 'password'}
      trailing={
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      }
      {...props}
    />
  );
});
PasswordInput.displayName = 'PasswordInput';

/** 4-step strength bar. Minimum accepted by the API is 12 characters. */
export function PasswordStrength({ value }: { value: string }) {
  if (!value) return null;
  let score = 0;
  if (value.length >= 12) score++;
  if (value.length >= 16) score++;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++;
  if (/\d/.test(value) && /[^A-Za-z0-9]/.test(value)) score++;
  if (value.length < 12) score = Math.min(score, 1);
  const labels = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['bg-red-500', 'bg-red-500', 'bg-amber-500', 'bg-emerald-500', 'bg-emerald-600'];
  return (
    <div className="flex items-center gap-3 pt-1">
      <div className="grid flex-1 grid-cols-4 gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={cn('h-1 rounded-full transition-colors duration-300', i < Math.max(score, 1) ? colors[score] : 'bg-zinc-200')} />
        ))}
      </div>
      <span className="w-16 text-right text-xs text-zinc-500">{value.length < 12 ? labels[0] : labels[score]}</span>
    </div>
  );
}

export function SubmitButton({ pending, children, busy }: { pending: boolean; children: React.ReactNode; busy: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="group relative inline-flex h-11 w-full items-center justify-center overflow-hidden rounded-xl bg-zinc-950 text-sm font-medium text-white shadow-[0_1px_2px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.12)] transition-all hover:bg-zinc-800 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-900/15 disabled:cursor-not-allowed disabled:opacity-80"
    >
      {pending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{busy}</> : children}
    </button>
  );
}

export const CheckboxField = forwardRef<HTMLInputElement, Omit<React.ComponentProps<'input'>, 'type'> & { label: React.ReactNode }>(
  ({ label, id, className, ...props }, ref) => (
    <label htmlFor={id} className={cn('inline-flex cursor-pointer select-none items-center gap-2 text-[13px] text-zinc-700', className)}>
      <span className="relative flex h-4 w-4 items-center justify-center">
        <input
          ref={ref}
          id={id}
          type="checkbox"
          className="peer h-4 w-4 cursor-pointer appearance-none rounded-[5px] border border-zinc-300 bg-white transition-colors checked:border-zinc-950 checked:bg-zinc-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-900/10"
          {...props}
        />
        <Check className="pointer-events-none absolute h-3 w-3 text-white opacity-0 peer-checked:opacity-100" strokeWidth={3} />
      </span>
      {label}
    </label>
  ),
);
CheckboxField.displayName = 'CheckboxField';

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700 animate-fade-up">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
