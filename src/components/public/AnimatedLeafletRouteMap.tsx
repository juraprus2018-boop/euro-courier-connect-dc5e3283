import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Truck, MapPin, Loader2 } from 'lucide-react';

interface Props {
  fromName?: string;
  fromLat?: number;
  fromLng?: number;
  toName: string;
  toLat: number;
  toLng: number;
  afstandKm?: number | null;
  rijtijdMinuten?: number | null;
  showStats?: boolean;
}

const DEFAULT_FROM_LAT = 51.4386732;
const DEFAULT_FROM_LNG = 5.5223595;

function primaryColor() {
  if (typeof window === 'undefined') return 'hsl(220, 90%, 25%)';
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
  return raw ? `hsl(${raw})` : 'hsl(220, 90%, 25%)';
}

function ctaColor() {
  if (typeof window === 'undefined') return '#ef4444';
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--cta').trim();
  return raw ? `hsl(${raw})` : '#ef4444';
}

function makeDotIcon(color: string, label: string) {
  return L.divIcon({
    className: '',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    html: `<div style="position:relative">
      <div style="width:18px;height:18px;border-radius:50%;background:${color};box-shadow:0 0 0 4px ${color}33;border:2px solid white;"></div>
      <div style="position:absolute;left:50%;transform:translateX(-50%);bottom:24px;background:white;color:#0f172a;padding:2px 8px;border-radius:6px;font-size:11px;font-weight:600;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.15)">${label}</div>
    </div>`,
  });
}

function makeTruckIcon(color: string) {
  return L.divIcon({
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    html: `<div style="width:36px;height:36px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;color:white;box-shadow:0 4px 12px rgba(0,0,0,0.25);border:3px solid white">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 17h4V5H2v12h3"/><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>
    </div>`,
  });
}

export function AnimatedLeafletRouteMap({
  fromName = 'Eindhoven',
  fromLat = DEFAULT_FROM_LAT,
  fromLng = DEFAULT_FROM_LNG,
  toName,
  toLat,
  toLng,
  afstandKm,
  rijtijdMinuten,
  showStats = true,
}: Props) {
  const elRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const truckRef = useRef<L.Marker | null>(null);
  const animRef = useRef<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{ km?: number; minuten?: number }>({
    km: afstandKm ?? undefined,
    minuten: rijtijdMinuten ?? undefined,
  });

  useEffect(() => {
    if (!elRef.current || mapRef.current) return;

    const map = L.map(elRef.current, {
      zoomControl: true,
      scrollWheelZoom: false,
      attributionControl: true,
    }).setView([(fromLat + toLat) / 2, (fromLng + toLng) / 2], 5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    let cancelled = false;
    setLoading(true);

    const primary = primaryColor();
    const cta = ctaColor();

    // Markers
    const fromMarker = L.marker([fromLat, fromLng], { icon: makeDotIcon(primary, fromName) }).addTo(map);
    const toMarker = L.marker([toLat, toLng], { icon: makeDotIcon(cta, toName) }).addTo(map);

    let polyline: L.Polyline | null = null;
    let truck: L.Marker | null = null;

    async function loadRoute() {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();
        if (cancelled) return;

        const route = data?.routes?.[0];
        const coords: [number, number][] = route?.geometry?.coordinates?.map(
          (c: [number, number]) => [c[1], c[0]],
        ) ?? [];

        if (coords.length === 0) {
          // Fallback: rechte lijn
          coords.push([fromLat, fromLng], [toLat, toLng]);
        }

        polyline = L.polyline(coords, {
          color: primary,
          weight: 4,
          opacity: 0.85,
          dashArray: '1, 8',
          lineCap: 'round',
        }).addTo(map);

        map.fitBounds(polyline.getBounds(), { padding: [40, 40] });

        // Stats van OSRM (alleen als geen prop is meegegeven)
        if (route) {
          setStats({
            km: afstandKm ?? Math.round(route.distance / 1000),
            minuten: rijtijdMinuten ?? Math.round(route.duration / 60),
          });
        }

        // Geanimeerde truck langs route
        truck = L.marker(coords[0], { icon: makeTruckIcon(primary), interactive: false, zIndexOffset: 1000 }).addTo(map);
        truckRef.current = truck;

        const DURATION = 9000; // ms voor één rit
        let start: number | null = null;

        const tick = (ts: number) => {
          if (cancelled || !truck) return;
          if (start == null) start = ts;
          const t = ((ts - start) % DURATION) / DURATION;
          const idx = Math.min(coords.length - 1, Math.floor(t * (coords.length - 1)));
          truck.setLatLng(coords[idx]);
          animRef.current = requestAnimationFrame(tick);
        };
        animRef.current = requestAnimationFrame(tick);
      } catch {
        // Stille fallback: rechte lijn
        if (cancelled) return;
        polyline = L.polyline([[fromLat, fromLng], [toLat, toLng]], {
          color: primary,
          weight: 3,
          opacity: 0.8,
          dashArray: '4, 8',
        }).addTo(map);
        map.fitBounds(polyline.getBounds(), { padding: [40, 40] });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadRoute();

    return () => {
      cancelled = true;
      if (animRef.current) cancelAnimationFrame(animRef.current);
      animRef.current = null;
      if (truck) truck.remove();
      if (polyline) polyline.remove();
      fromMarker.remove();
      toMarker.remove();
    };
  }, [fromLat, fromLng, toLat, toLng, fromName, toName, afstandKm, rijtijdMinuten]);

  const uren = stats.minuten ? Math.round(stats.minuten / 60) : null;

  return (
    <div className="rounded-2xl overflow-hidden border border-border bg-card shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border-b border-border bg-gradient-to-br from-primary/5 to-background">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Truck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-base sm:text-lg leading-tight">
              {fromName} <span className="text-muted-foreground">→</span> {toName}
            </h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" /> Directe rit, één vaste chauffeur
            </p>
          </div>
        </div>
        {showStats && (
          <div className="flex gap-4 text-sm">
            {uren != null && (
              <div className="text-right">
                <div className="font-bold text-primary text-lg leading-none">~{uren} u</div>
                <div className="text-muted-foreground text-xs">rijtijd</div>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="relative">
        <div ref={elRef} className="w-full h-[360px] sm:h-[440px] bg-muted" />
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm pointer-events-none">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
      </div>
    </div>
  );
}

export default AnimatedLeafletRouteMap;
