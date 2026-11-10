'use client';

import { useState } from 'react';

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94l3.66-2.84z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
  </svg>
);

const AppleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor" aria-hidden>
    <path d="M16.37 12.6c-.03-2.6 2.12-3.85 2.22-3.91-1.21-1.77-3.09-2.01-3.76-2.04-1.6-.16-3.12.94-3.93.94-.81 0-2.06-.92-3.39-.89-1.74.03-3.35 1.01-4.25 2.57-1.81 3.14-.46 7.79 1.3 10.34.86 1.25 1.89 2.65 3.23 2.6 1.3-.05 1.79-.84 3.36-.84s2.01.84 3.38.81c1.4-.02 2.28-1.27 3.13-2.52.99-1.45 1.39-2.85 1.42-2.92-.03-.01-2.72-1.04-2.71-4.14zM13.8 4.98c.71-.86 1.19-2.06 1.06-3.25-1.02.04-2.27.68-3 1.54-.66.76-1.24 1.98-1.08 3.15 1.14.09 2.31-.58 3.02-1.44z" />
  </svg>
);

const GithubIcon = () => (
  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor" aria-hidden>
    <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-1.96c-3.2.7-3.87-1.54-3.87-1.54-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.8 1.18 1.83 1.18 3.09 0 4.42-2.69 5.39-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />
  </svg>
);

const providers = [
  { id: 'google', label: 'Continue with Google', Icon: GoogleIcon },
  { id: 'apple', label: 'Continue with Apple', Icon: AppleIcon },
  { id: 'github', label: 'Continue with GitHub', Icon: GithubIcon },
];

export function OrDivider({ label = 'Or continue with' }: { label?: string }) {
  return (
    <div className="relative my-6 flex items-center">
      <span className="h-px flex-1 bg-zinc-200" />
      <span className="px-3 text-xs text-zinc-500">{label}</span>
      <span className="h-px flex-1 bg-zinc-200" />
    </div>
  );
}

/** Social sign-in buttons. Providers are not wired to a backend yet, so a click shows a notice. */
export function SocialButtons() {
  const [notice, setNotice] = useState<string>();
  return (
    <div className="space-y-2.5">
      {providers.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => setNotice(`${label.replace('Continue with ', '')} sign-in isn't available yet. Please use email and password.`)}
          className="inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-zinc-200 bg-white text-sm font-medium text-zinc-800 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-all hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-zinc-900/10"
        >
          <Icon />
          {label}
        </button>
      ))}
      {notice && <p role="status" className="pt-1 text-center text-xs text-zinc-500 animate-fade-up">{notice}</p>}
    </div>
  );
}
