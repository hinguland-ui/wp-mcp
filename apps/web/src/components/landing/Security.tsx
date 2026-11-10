import { Ban, EyeOff, FileClock, KeyRound, Lock, ShieldCheck } from 'lucide-react';
import { Container, SectionHeading } from './primitives';

const items = [
  { icon: Lock, title: 'Encrypted at rest', text: 'Per-site secrets are sealed with AES-256-GCM before they touch the database.' },
  { icon: KeyRound, title: 'Short-lived tokens', text: 'Access tokens expire quickly and refresh tokens rotate on every use.' },
  { icon: ShieldCheck, title: 'Least privilege', text: 'AI apps only ever get the scopes you approve, per website.' },
  { icon: Ban, title: 'Revoke any time', text: 'Withdraw an app’s access whenever you want — revoked tokens stop working.' },
  { icon: FileClock, title: 'Complete audit trail', text: 'Every request, allowed or denied, is logged with time and outcome.' },
  { icon: EyeOff, title: 'No passwords shared', text: 'Pairing uses one-time codes. Your WordPress login never leaves your site.' },
];

export function Security() {
  return (
    <section id="security" className="relative scroll-mt-20 overflow-hidden bg-zinc-950 py-24 sm:py-32">
      <div aria-hidden className="absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,black,transparent)]" />
        <div className="absolute left-1/2 top-0 h-80 w-[700px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(99,102,241,0.25),transparent)]" />
      </div>
      <Container className="relative">
        <SectionHeading center dark eyebrow="Security" title="Secure by default, not by configuration" description="AI access to production sites is serious. These protections are on for every account, including Free." />

        <div className="mt-16 grid gap-px overflow-hidden rounded-2xl bg-white/10 ring-1 ring-white/10 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ icon: Icon, title, text }) => (
            <div key={title} className="bg-zinc-950 p-7 transition-colors hover:bg-zinc-900">
              <Icon className="h-5 w-5 text-indigo-300" />
              <h3 className="mt-4 text-[15px] font-semibold text-white">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">{text}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
