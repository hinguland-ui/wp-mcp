import { Activity, BarChart3, Globe, KeyRound, ShieldCheck, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Container, SectionHeading } from './primitives';

function Card({ icon: Icon, title, text, className, children }: {
  icon: React.ElementType;
  title: string;
  text: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn('group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-shadow hover:shadow-[0_8px_30px_-12px_rgba(15,23,42,0.15)]', className)}>
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-950 text-white"><Icon className="h-4 w-4" /></span>
      <h3 className="mt-5 text-[17px] font-semibold tracking-tight text-zinc-950">{title}</h3>
      <p className="mt-1.5 text-[15px] leading-relaxed text-zinc-600">{text}</p>
      {children && <div className="mt-6 flex-1">{children}</div>}
    </div>
  );
}

const bars = [28, 42, 35, 58, 47, 66, 52, 74, 61, 83, 70, 92];

export function Features() {
  return (
    <section id="features" className="scroll-mt-20 py-24 sm:py-32">
      <Container>
        <SectionHeading
          eyebrow="Features"
          title={<>Everything you need to let AI in<span className="text-zinc-400"> — safely.</span></>}
          description="Built for site owners and agencies who want the speed of AI without handing over the keys."
        />

        <div className="mt-14 grid gap-4 md:grid-cols-6">
          <Card icon={ShieldCheck} title="Scoped permissions" text="Turn each capability on or off per website. Read posts but not edit them, manage media but never touch products." className="md:col-span-3">
            <div className="grid grid-cols-2 gap-2">
              {[['posts:read', true], ['posts:write', true], ['media:read', true], ['products:write', false]].map(([n, on]) => (
                <div key={String(n)} className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 ring-1 ring-zinc-200/70">
                  <code className="text-[12px] text-zinc-700">{n}</code>
                  <span className={cn('flex h-4 w-7 items-center rounded-full p-0.5', on ? 'justify-end bg-zinc-950' : 'justify-start bg-zinc-300')}><span className="h-3 w-3 rounded-full bg-white" /></span>
                </div>
              ))}
            </div>
          </Card>

          <Card icon={Zap} title="Pair in under a minute" text="Install the plugin, paste a one-time code, done. No passwords or API keys copied around." className="md:col-span-3">
            <div className="flex items-center justify-center gap-2 rounded-xl bg-zinc-50 py-5 ring-1 ring-zinc-200/70">
              {'K7Q-2MX'.split('').map((ch, i) => (
                <span key={i} className={cn('flex h-10 w-8 items-center justify-center rounded-lg font-mono text-lg font-semibold', ch === '-' ? 'w-3 text-zinc-300' : 'bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200')}>{ch}</span>
              ))}
            </div>
          </Card>

          <Card icon={Activity} title="Full audit log" text="Every tool call is recorded with the app, the site, the outcome and the time." className="md:col-span-2">
            <ul className="space-y-1.5 text-[12px]">
              {[['update_post', 'ok', '2s'], ['list_media', 'ok', '9s'], ['update_product', 'denied', '1m']].map(([t, s, w]) => (
                <li key={t} className="flex items-center gap-2 rounded-md bg-zinc-50 px-2.5 py-1.5 ring-1 ring-zinc-200/70">
                  <span className={cn('h-1.5 w-1.5 rounded-full', s === 'ok' ? 'bg-emerald-500' : 'bg-amber-500')} />
                  <code className="text-zinc-700">{t}</code>
                  <span className="ml-auto text-zinc-400">{w} ago</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card icon={KeyRound} title="OAuth 2.1 consent" text="AI apps connect through a standard consent screen. You approve — and you can revoke any time." className="md:col-span-2" />

          <Card icon={Globe} title="Many sites, one dashboard" text="Manage every WordPress install you run, each with its own permissions and limits." className="md:col-span-2" />

          <div className="group grid items-center gap-8 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-shadow hover:shadow-[0_8px_30px_-12px_rgba(15,23,42,0.15)] md:col-span-6 md:grid-cols-[1fr_1.4fr]">
            <div>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-950 text-white"><BarChart3 className="h-4 w-4" /></span>
              <h3 className="mt-5 text-[17px] font-semibold tracking-tight text-zinc-950">Usage analytics</h3>
              <p className="mt-1.5 text-[15px] leading-relaxed text-zinc-600">See requests, success rate, response times and the most-used tools for every site — over 7, 30 or 90 days.</p>
            </div>
            <div className="flex h-32 items-end gap-1.5 border-b border-zinc-200 pb-px">
              {bars.map((h, i) => (
                <span key={i} className="flex-1 rounded-t-[4px] bg-indigo-500/75 transition-colors group-hover:bg-indigo-500" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
