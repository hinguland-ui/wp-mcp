import Link from 'next/link';
import { ArrowLeft, KeyRound } from 'lucide-react';
import { AuthShell } from '@/components/auth/AuthShell';

export default function ForgotPasswordPage() {
  return (
    <AuthShell title="Forgot password?" description="Password reset by email is not set up yet.">
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50/60 p-5 text-center">
        <span className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-zinc-700 shadow-sm ring-1 ring-zinc-200">
          <KeyRound className="h-4 w-4" />
        </span>
        <p className="text-sm text-zinc-600">Please contact your administrator or support to reset the password for your account.</p>
      </div>
      <Link href="/login" className="mt-6 inline-flex w-full items-center justify-center gap-1.5 text-sm font-medium text-zinc-950 underline-offset-4 hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back to sign in
      </Link>
    </AuthShell>
  );
}
