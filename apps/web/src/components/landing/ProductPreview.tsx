import { Check, CheckCircle2, FileText, Lock, ShieldCheck, Sparkles } from 'lucide-react';

const calls = [
  { tool: 'get_post', detail: 'Pricing page · id 42', delay: '0.6s' },
  { tool: 'update_post', detail: 'Meta description updated', delay: '1.1s' },
  { tool: 'create_post', detail: '“Spring launch” saved as draft', delay: '1.6s' },
];

const scopes = [
  { name: 'posts:read', on: true },
  { name: 'posts:write', on: true },
  { name: 'media:read', on: true },
  { name: 'products:write', on: false },
];

/** Static HTML illustration of the product: an AI chat calling tools + the site's permissions & log. */
export function ProductPreview() {
  return (
    <div className="relative">
      {/* Glow under the window */}
      <div aria-hidden className="absolute -inset-x-10 -bottom-10 top-10 -z-10 rounded-[3rem] bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.18),transparent_65%)] blur-2xl" />

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_30px_80px_-20px_rgba(15,23,42,0.25),0_0_0_1px_rgba(15,23,42,0.02)]">
        {/* Window chrome */}
        <div className="flex h-10 items-center gap-2 border-b border-zinc-100 bg-zinc-50/80 px-4">
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
          <span className="mx-auto rounded-md bg-white px-3 py-0.5 text-[11px] text-zinc-400 ring-1 ring-zinc-200">yoursite.com · connected via MCP</span>
        </div>

        <div className="grid md:grid-cols-[1.25fr_1fr]">
          {/* AI chat */}
          <div className="space-y-4 border-zinc-100 p-5 md:border-r sm:p-6">
            <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-zinc-950 px-4 py-2.5 text-[13px] leading-relaxed text-white">
              Update the meta description on our pricing page, then draft a launch post for the spring sale.
            </div>

            <div className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100"><Sparkles className="h-3.5 w-3.5" /></span>
              <div className="min-w-0 flex-1 space-y-2">
                {calls.map((c) => (
                  <div key={c.tool} className="flex items-center gap-2.5 rounded-xl border border-zinc-200 bg-white px-3 py-2 opacity-0 shadow-[0_1px_2px_rgba(16,24,40,0.04)] motion-safe:animate-fade-up motion-reduce:opacity-100" style={{ animationDelay: c.delay }}>
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    <code className="text-[12px] font-medium text-zinc-900">{c.tool}</code>
                    <span className="truncate text-[12px] text-zinc-500">{c.detail}</span>
                  </div>
                ))}
                <p className="pt-1 text-[13px] leading-relaxed text-zinc-700 opacity-0 motion-safe:animate-fade-up motion-reduce:opacity-100" style={{ animationDelay: '2.1s' }}>
                  Done. The meta description is live, and the launch post is waiting for your review in Drafts.
                </p>
              </div>
            </div>
          </div>

          {/* Site panel */}
          <div className="space-y-5 bg-zinc-50/50 p-5 sm:p-6">
            <div>
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-400"><ShieldCheck className="h-3.5 w-3.5" />Permissions</p>
              <ul className="mt-3 space-y-2">
                {scopes.map((s) => (
                  <li key={s.name} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 ring-1 ring-zinc-200/80">
                    <code className="text-[12px] text-zinc-700">{s.name}</code>
                    <span className={`flex h-4 w-7 items-center rounded-full p-0.5 transition-colors ${s.on ? 'justify-end bg-zinc-950' : 'justify-start bg-zinc-200'}`}>
                      <span className="h-3 w-3 rounded-full bg-white shadow-sm" />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-400"><FileText className="h-3.5 w-3.5" />Activity</p>
              <ul className="mt-3 space-y-2 text-[12px]">
                <li className="flex items-center gap-2 text-zinc-600"><Check className="h-3.5 w-3.5 text-emerald-600" />create_post <span className="ml-auto text-zinc-400">just now</span></li>
                <li className="flex items-center gap-2 text-zinc-600"><Check className="h-3.5 w-3.5 text-emerald-600" />update_post <span className="ml-auto text-zinc-400">1s ago</span></li>
                <li className="flex items-center gap-2 text-zinc-600"><Lock className="h-3.5 w-3.5 text-amber-600" />update_product denied <span className="ml-auto text-zinc-400">2m ago</span></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
