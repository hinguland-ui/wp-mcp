import { Container } from './primitives';

const clients = ['Claude', 'ChatGPT', 'Cursor', 'VS Code', 'Windsurf', 'Zed'];

export function LogoStrip() {
  return (
    <section className="border-y border-zinc-100 bg-zinc-50/50 py-10">
      <Container>
        <p className="text-center text-[13px] font-medium text-zinc-500">Works with any MCP-compatible AI app</p>
        <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
          {clients.map((c) => (
            <li key={c} className="text-lg font-semibold tracking-tight text-zinc-400 transition-colors hover:text-zinc-700">{c}</li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
