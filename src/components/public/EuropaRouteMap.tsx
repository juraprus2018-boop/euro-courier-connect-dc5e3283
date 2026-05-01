import { MapPin, Truck, Zap } from 'lucide-react';
import { EUROPE_PATH } from './europePath';

/**
 * Echte Europa-kaart (vereenvoudigde GeoJSON) met geanimeerde
 * spoedkoerier-routes vanuit Nederland naar belangrijke steden.
 */
export function EuropaRouteMap() {
  // ViewBox 0 0 500 600, equirectangular projectie (lon -12..35, lat 35..62)
  const NL = { x: 183.9, y: 219.3 };

  const destinations = [
    { name: 'Parijs', x: 152.7, y: 292.2, delay: 0 },
    { name: 'Berlijn', x: 270.2, y: 210.7, delay: 0.35 },
    { name: 'Brussel', x: 173.9, y: 247.8, delay: 0.7 },
    { name: 'Wenen', x: 301.8, y: 306.4, delay: 1.05 },
    { name: 'Rome', x: 260.5, y: 446.7, delay: 1.4 },
    { name: 'Madrid', x: 88.3, y: 479.6, delay: 1.75 },
    { name: 'Warschau', x: 351.2, y: 217.1, delay: 2.1 },
    { name: 'Zagreb', x: 297.7, y: 359.8, delay: 2.45 },
    { name: 'Kopenhagen', x: 261.4, y: 140.4, delay: 2.8 },
  ];

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-background to-accent/5 border shadow-sm">
      {/* Floating badges */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 rounded-full bg-background/95 backdrop-blur px-3 py-1.5 text-xs font-semibold shadow-sm border">
        <Zap className="h-3.5 w-3.5 text-primary" />
        Spoedkoerier door heel Europa
      </div>
      <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-3 py-1.5 text-xs font-semibold shadow-md">
        <Truck className="h-3.5 w-3.5" />
        Direct van A naar B
      </div>

      <svg
        viewBox="0 0 500 600"
        className="h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Spoedkoerier routes vanuit Nederland naar Europa"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <polygon points="0 0, 6 3, 0 6" fill="hsl(var(--primary))" />
          </marker>
          <radialGradient id="nlGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.55" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="seaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.04" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.10" />
          </linearGradient>
        </defs>

        {/* Zee achtergrond */}
        <rect width="500" height="600" fill="url(#seaGrad)" />

        {/* Echte Europa-landen */}
        <path
          d={EUROPE_PATH}
          fill="hsl(var(--muted))"
          fillOpacity="0.85"
          stroke="hsl(var(--border))"
          strokeWidth="0.5"
          strokeLinejoin="round"
        />

        {/* Pulserende glow op NL */}
        <circle cx={NL.x} cy={NL.y} r="40" fill="url(#nlGlow)">
          <animate attributeName="r" values="18;42;18" dur="2.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.9;0.1;0.9" dur="2.5s" repeatCount="indefinite" />
        </circle>

        {/* Routes */}
        {destinations.map((d) => {
          const mx = (NL.x + d.x) / 2;
          const my = (NL.y + d.y) / 2 - 25;
          const path = `M ${NL.x} ${NL.y} Q ${mx} ${my} ${d.x} ${d.y}`;
          return (
            <g key={d.name}>
              <path
                d={path}
                fill="none"
                stroke="hsl(var(--primary))"
                strokeOpacity="0.35"
                strokeWidth="1.4"
                strokeDasharray="4 3"
                markerEnd="url(#arrowhead)"
              />
              <circle r="3.5" fill="hsl(var(--primary))">
                <animateMotion dur="3s" repeatCount="indefinite" begin={`${d.delay}s`} path={path} />
                <animate
                  attributeName="opacity"
                  values="0;1;1;0"
                  dur="3s"
                  begin={`${d.delay}s`}
                  repeatCount="indefinite"
                />
              </circle>
              <circle
                cx={d.x}
                cy={d.y}
                r="3.5"
                fill="hsl(var(--primary))"
                stroke="hsl(var(--background))"
                strokeWidth="1.5"
              />
              <text
                x={d.x + 7}
                y={d.y + 3.5}
                fontSize="10.5"
                fontWeight="600"
                fill="hsl(var(--foreground))"
                style={{ paintOrder: 'stroke', stroke: 'hsl(var(--background))', strokeWidth: 3 }}
              >
                {d.name}
              </text>
            </g>
          );
        })}

        {/* NL pin */}
        <circle
          cx={NL.x}
          cy={NL.y}
          r="6"
          fill="hsl(var(--primary))"
          stroke="hsl(var(--background))"
          strokeWidth="2"
        />
        <text
          x={NL.x}
          y={NL.y - 11}
          fontSize="11"
          fontWeight="700"
          fill="hsl(var(--foreground))"
          textAnchor="middle"
          style={{ paintOrder: 'stroke', stroke: 'hsl(var(--background))', strokeWidth: 3 }}
        >
          🇳🇱 Nederland
        </text>
      </svg>

      <div className="absolute bottom-4 left-4 z-10 max-w-[60%]">
        <div className="flex items-start gap-2 rounded-lg bg-background/95 backdrop-blur px-3 py-2 text-xs shadow-sm border">
          <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">24/7 beschikbaar</div>
            <div className="text-muted-foreground">Direct van deur tot deur, geen overslag</div>
          </div>
        </div>
      </div>
    </div>
  );
}
