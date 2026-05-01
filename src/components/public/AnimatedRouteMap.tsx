import { useMemo } from 'react';
import { Truck } from 'lucide-react';

interface AnimatedRouteMapProps {
  fromName?: string;
  toName: string;
  toLat: number;
  toLng: number;
  afstandKm?: number | null;
  rijtijdMinuten?: number | null;
}

// Eindhoven (depot) als startpunt
const FROM_LAT = 51.4386732;
const FROM_LNG = 5.5223595;

// Approx. equirectangular bounding box for Europe used for projection
const BBOX = { minLng: -10, maxLng: 30, minLat: 35, maxLat: 60 };
const W = 600;
const H = 400;

function project(lng: number, lat: number) {
  const x = ((lng - BBOX.minLng) / (BBOX.maxLng - BBOX.minLng)) * W;
  const y = H - ((lat - BBOX.minLat) / (BBOX.maxLat - BBOX.minLat)) * H;
  return { x, y };
}

export function AnimatedRouteMap({ fromName = 'Eindhoven', toName, toLat, toLng, afstandKm, rijtijdMinuten }: AnimatedRouteMapProps) {
  const { from, to, pathD } = useMemo(() => {
    const from = project(FROM_LNG, FROM_LAT);
    const to = project(toLng, toLat);
    const mx = (from.x + to.x) / 2;
    const my = (from.y + to.y) / 2 - Math.abs(to.x - from.x) * 0.25;
    const pathD = `M ${from.x} ${from.y} Q ${mx} ${my} ${to.x} ${to.y}`;
    return { from, to, pathD };
  }, [toLat, toLng]);

  const uren = rijtijdMinuten ? Math.round(rijtijdMinuten / 60) : null;

  return (
    <div className="rounded-2xl overflow-hidden border border-border bg-gradient-to-br from-primary/5 to-primary/10 p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="font-display font-semibold text-lg">
            {fromName} → {toName}
          </h3>
          <p className="text-sm text-muted-foreground">Directe rit, één chauffeur</p>
        </div>
        <div className="flex gap-4 text-sm">
          {afstandKm != null && (
            <div className="text-right">
              <div className="font-bold text-primary text-lg leading-none">{Math.round(afstandKm)} km</div>
              <div className="text-muted-foreground text-xs">afstand</div>
            </div>
          )}
          {uren != null && (
            <div className="text-right">
              <div className="font-bold text-primary text-lg leading-none">~{uren} u</div>
              <div className="text-muted-foreground text-xs">rijtijd</div>
            </div>
          )}
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
        {/* subtiele grid achtergrond */}
        <defs>
          <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="hsl(var(--primary))" strokeOpacity="0.06" strokeWidth="1" />
          </pattern>
          <linearGradient id="routeLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--cta))" />
          </linearGradient>
        </defs>
        <rect width={W} height={H} fill="url(#grid)" />

        {/* Route lijn (gestippeld + animatie) */}
        <path
          d={pathD}
          fill="none"
          stroke="url(#routeLine)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="8 8"
          style={{ animation: 'dashmove 1.5s linear infinite' }}
        />

        {/* Startpunt */}
        <g>
          <circle cx={from.x} cy={from.y} r="14" fill="hsl(var(--primary))" opacity="0.2">
            <animate attributeName="r" values="10;18;10" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx={from.x} cy={from.y} r="6" fill="hsl(var(--primary))" />
          <text x={from.x} y={from.y - 18} textAnchor="middle" fontSize="13" fontWeight="600" fill="hsl(var(--primary))">
            {fromName}
          </text>
        </g>

        {/* Eindpunt */}
        <g>
          <circle cx={to.x} cy={to.y} r="14" fill="hsl(var(--cta))" opacity="0.25">
            <animate attributeName="r" values="10;20;10" dur="2s" begin="0.5s" repeatCount="indefinite" />
          </circle>
          <circle cx={to.x} cy={to.y} r="7" fill="hsl(var(--cta))" />
          <text x={to.x} y={to.y - 20} textAnchor="middle" fontSize="14" fontWeight="700" fill="hsl(var(--foreground))">
            {toName}
          </text>
        </g>

        {/* Bewegende truck langs path */}
        <g>
          <circle r="11" fill="hsl(var(--primary))" stroke="white" strokeWidth="2">
            <animateMotion dur="4s" repeatCount="indefinite" path={pathD} />
          </circle>
        </g>
      </svg>

      <style>{`@keyframes dashmove { to { stroke-dashoffset: -32; } }`}</style>

      <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Truck className="h-4 w-4 text-primary" />
        <span>Wij rijden meerdere keren per week deze route</span>
      </div>
    </div>
  );
}
