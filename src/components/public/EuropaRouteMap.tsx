import { MapPin, Truck, Zap } from 'lucide-react';

/**
 * Geanimeerde Europa-kaart met pijlen vanuit Nederland naar diverse landen.
 * Pure SVG — geen externe assets, schaalt scherp op elk scherm.
 */
export function EuropaRouteMap() {
  // Coordinaten in viewBox 0 0 500 600. NL = vertrekpunt.
  const NL = { x: 235, y: 235 };

  const destinations = [
    { name: 'Parijs', x: 200, y: 320, delay: 0 },
    { name: 'Berlijn', x: 305, y: 235, delay: 0.4 },
    { name: 'Brussel', x: 220, y: 270, delay: 0.8 },
    { name: 'Wenen', x: 320, y: 310, delay: 1.2 },
    { name: 'Rome', x: 295, y: 430, delay: 1.6 },
    { name: 'Madrid', x: 130, y: 440, delay: 2.0 },
    { name: 'Warschau', x: 365, y: 220, delay: 2.4 },
    { name: 'Zagreb', x: 330, y: 360, delay: 2.8 },
  ];

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-background to-accent/5 border shadow-sm">
      {/* Floating badges */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 rounded-full bg-background/90 backdrop-blur px-3 py-1.5 text-xs font-semibold shadow-sm border">
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
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="6"
            markerHeight="6"
            refX="5"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 6 3, 0 6" fill="hsl(var(--primary))" />
          </marker>
          <radialGradient id="nlGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.6" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Vereenvoudigd Europa silhouet */}
        <path
          d="M 60 180 Q 80 140 130 130 L 180 110 Q 230 100 280 115 L 340 130 Q 400 145 430 200 L 445 270 Q 450 340 420 400 L 380 470 Q 330 510 270 505 L 200 500 Q 140 490 100 440 L 70 380 Q 50 320 55 250 Z"
          fill="hsl(var(--muted))"
          fillOpacity="0.5"
          stroke="hsl(var(--border))"
          strokeWidth="1"
        />
        {/* UK */}
        <path
          d="M 130 220 Q 140 200 165 205 L 175 240 Q 170 270 150 275 Q 130 270 125 250 Z"
          fill="hsl(var(--muted))"
          fillOpacity="0.5"
          stroke="hsl(var(--border))"
          strokeWidth="1"
        />
        {/* Scandinavie */}
        <path
          d="M 280 60 Q 320 50 350 70 L 360 130 Q 340 150 310 145 L 285 110 Z"
          fill="hsl(var(--muted))"
          fillOpacity="0.5"
          stroke="hsl(var(--border))"
          strokeWidth="1"
        />

        {/* Pulserende glow op NL */}
        <circle cx={NL.x} cy={NL.y} r="40" fill="url(#nlGlow)">
          <animate
            attributeName="r"
            values="20;45;20"
            dur="2.5s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.8;0.1;0.8"
            dur="2.5s"
            repeatCount="indefinite"
          />
        </circle>

        {/* Routes */}
        {destinations.map((d, i) => {
          // Curved path met control point
          const mx = (NL.x + d.x) / 2;
          const my = (NL.y + d.y) / 2 - 30;
          const path = `M ${NL.x} ${NL.y} Q ${mx} ${my} ${d.x} ${d.y}`;
          return (
            <g key={d.name}>
              {/* Statische lijn */}
              <path
                d={path}
                fill="none"
                stroke="hsl(var(--primary))"
                strokeOpacity="0.25"
                strokeWidth="1.5"
                strokeDasharray="4 3"
                markerEnd="url(#arrowhead)"
              />
              {/* Animerende puls */}
              <circle r="3.5" fill="hsl(var(--primary))">
                <animateMotion
                  dur="3s"
                  repeatCount="indefinite"
                  begin={`${d.delay}s`}
                  path={path}
                />
                <animate
                  attributeName="opacity"
                  values="0;1;1;0"
                  dur="3s"
                  begin={`${d.delay}s`}
                  repeatCount="indefinite"
                />
              </circle>

              {/* Bestemming pin */}
              <circle
                cx={d.x}
                cy={d.y}
                r="4"
                fill="hsl(var(--primary))"
                stroke="hsl(var(--background))"
                strokeWidth="1.5"
              />
              <text
                x={d.x + 8}
                y={d.y + 4}
                fontSize="11"
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
          r="7"
          fill="hsl(var(--primary))"
          stroke="hsl(var(--background))"
          strokeWidth="2"
        />
        <text
          x={NL.x - 4}
          y={NL.y - 12}
          fontSize="12"
          fontWeight="700"
          fill="hsl(var(--foreground))"
          textAnchor="middle"
          style={{ paintOrder: 'stroke', stroke: 'hsl(var(--background))', strokeWidth: 3 }}
        >
          🇳🇱 Nederland
        </text>
      </svg>

      {/* Onder-info */}
      <div className="absolute bottom-4 left-4 z-10 max-w-[60%]">
        <div className="flex items-start gap-2 rounded-lg bg-background/90 backdrop-blur px-3 py-2 text-xs shadow-sm border">
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
