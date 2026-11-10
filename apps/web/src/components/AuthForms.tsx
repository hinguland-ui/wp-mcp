'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { Mail, User } from 'lucide-react';
import { LoginInput, RegisterInput, loginSchema, registerSchema } from '@wpconnect/shared';
import { loginAction, registerAction } from '@/lib/actions';
import { AuthShell } from '@/components/auth/AuthShell';
import { CheckboxField, Field, FormError, IconInput, PasswordInput, PasswordStrength, SubmitButton } from '@/components/auth/fields';
import { OrDivider, SocialButtons } from '@/components/auth/SocialButtons';

const linkCls = 'font-medium text-zinc-950 underline-offset-4 transition-colors hover:underline';

export function LoginForm({ next }: { next?: string }) {
  const [error, setError] = useState<string>();
  const [remember, setRemember] = useState(true);
  const [pending, start] = useTransition();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to continue."
      footer={<>Don&apos;t have an account? <Link className={linkCls} href="/register">Create an account</Link></>}
    >
      <form noValidate className="space-y-4" onSubmit={handleSubmit((v) => start(async () => { setError(undefined); const r = await loginAction(v, next, remember); if (r && !r.ok) setError(r.error); }))}>
        <Field id="email" label="Email" error={errors.email?.message}>
          <IconInput id="email" icon={Mail} type="email" placeholder="Enter your email" autoComplete="email" autoFocus invalid={!!errors.email} {...register('email')} />
        </Field>
        <Field id="password" label="Password" error={errors.password && 'Enter your password'}>
          <PasswordInput id="password" placeholder="Enter your password" autoComplete="current-password" invalid={!!errors.password} {...register('password')} />
        </Field>
        <div className="flex items-center justify-between pt-0.5">
          <CheckboxField id="remember" label="Remember me" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          <Link href="/forgot-password" className="text-[13px] font-medium text-zinc-950 underline-offset-4 hover:underline">Forgot password?</Link>
        </div>
        <FormError message={error} />
        <SubmitButton pending={pending} busy="Signing in…">Sign in</SubmitButton>
      </form>
      <OrDivider />
      <SocialButtons />
    </AuthShell>
  );
}

export function RegisterForm() {
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });
  const password = watch('password') ?? '';

  return (
    <AuthShell
      title="Create an account"
      description="Start connecting your WordPress sites."
      footer={<>Already have an account? <Link className={linkCls} href="/login">Sign in</Link></>}
    >
      <form noValidate className="space-y-4" onSubmit={handleSubmit((v) => start(async () => { setError(undefined); const r = await registerAction(v); if (r && !r.ok) setError(r.error); }))}>
        <Field id="name" label="Full name" error={errors.name?.message}>
          <IconInput id="name" icon={User} placeholder="Enter your name" autoComplete="name" autoFocus invalid={!!errors.name} {...register('name')} />
        </Field>
        <Field id="email" label="Email" error={errors.email?.message}>
          <IconInput id="email" icon={Mail} type="email" placeholder="Enter your email" autoComplete="email" invalid={!!errors.email} {...register('email')} />
        </Field>
        <Field id="password" label="Password" error={errors.password?.message}>
          <PasswordInput id="password" placeholder="At least 12 characters" autoComplete="new-password" invalid={!!errors.password} {...register('password')} />
          <PasswordStrength value={password} />
        </Field>
        <FormError message={error} />
        <SubmitButton pending={pending} busy="Creating account…">Create account</SubmitButton>
      </form>
      <OrDivider />
      <SocialButtons />
    </AuthShell>
  );
}
