import { cn } from '@/lib/utils';

const grain =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

/**
 * Soft, slowly drifting SaaS-style aurora: deep navy at the top fading into
 * indigo / violet / rose light at the bottom, with film grain on top.
 * Pure CSS (transform-only animations), so it stays smooth and cheap.
 */
export function AuroraBackground({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn('pointer-events-none absolute inset-0 overflow-hidden bg-[#06060c]', className)}>
      {/* Light blobs */}
      <div className="motion-safe-only absolute -left-[20%] top-[25%] h-[70%] w-[80%] animate-aurora-a rounded-full bg-[radial-gradient(closest-side,rgba(79,70,229,0.55),transparent)] blur-3xl will-change-transform" />
      <div className="motion-safe-only absolute -bottom-[25%] left-[10%] h-[75%] w-[90%] animate-aurora-b rounded-full bg-[radial-gradient(closest-side,rgba(168,85,247,0.55),transparent)] blur-3xl will-change-transform" />
      <div className="motion-safe-only absolute -bottom-[30%] -right-[15%] h-[70%] w-[70%] animate-aurora-c rounded-full bg-[radial-gradient(closest-side,rgba(244,114,182,0.45),transparent)] blur-3xl will-change-transform" />
      <div className="motion-safe-only absolute -bottom-[35%] right-[5%] h-[45%] w-[55%] animate-aurora-a rounded-full bg-[radial-gradient(closest-side,rgba(251,146,60,0.28),transparent)] blur-3xl will-change-transform [animation-delay:-9s]" />
      <div className="motion-safe-only absolute -right-[10%] -top-[15%] h-[50%] w-[55%] animate-aurora-c rounded-full bg-[radial-gradient(closest-side,rgba(56,189,248,0.16),transparent)] blur-3xl will-change-transform [animation-delay:-14s]" />

      {/* Darken the top so text stays crisp */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#06060c] via-[#06060c]/60 to-transparent" />

      {/* Faint grid, fading out downward */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_top_left,black_20%,transparent_70%)]" />

      {/* Film grain */}
      <div className="absolute inset-0 opacity-[0.18] mix-blend-overlay" style={{ backgroundImage: grain }} />
    </div>
  );
}
