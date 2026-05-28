// Toon prijzen altijd als indicatieve bandbreedte.
// Internationale ritten zijn vanaf 1 juli op aanvraag en kunnen tot 20% duurder uitvallen.
// We tonen daarom geen vaste prijzen meer maar een range van basis tot +20%.

const roundTo = (n: number, step = 25) => Math.max(step, Math.round(n / step) * step);

export function formatPrijsRange(base: number | null | undefined, opts?: { upliftPct?: number; step?: number }): string | null {
  if (!base || base <= 0) return null;
  const uplift = opts?.upliftPct ?? 0.20;
  const step = opts?.step ?? 25;
  const low = roundTo(base, step);
  const high = roundTo(base * (1 + uplift), step);
  const f = (n: number) => `€ ${n.toLocaleString('nl-NL')}`;
  if (high <= low) return f(low);
  return `${f(low)} – ${f(high)}`;
}

export const PRIJS_DISCLAIMER =
  'Indicatieve bandbreedte excl. BTW. Internationale spoedritten gaan vanaf 1 juli op aanvraag; de definitieve prijs ontvangt u in de offerte op basis van beschikbaarheid voertuig, gewicht, afmetingen en eventuele hotelovernachtingen.';
