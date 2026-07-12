import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface City {
  id: string;
  naam: string;
  latitude: number | null;
  longitude: number | null;
}

interface ServiceAreaMapProps {
  cities: City[];
  landNaam: string;
}

// Depot Son en Breugel
const DEPOT: [number, number] = [51.4386732, 5.5223595];

const depotIcon = new L.DivIcon({
  className: '',
  html: `<div style="background:hsl(220,90%,25%);border:3px solid #fff;width:18px;height:18px;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const cityIcon = new L.DivIcon({
  className: '',
  html: `<div style="background:#e11d48;border:2px solid #fff;width:12px;height:12px;border-radius:50%;box-shadow:0 1px 3px rgba(0,0,0,0.3)"></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

export function ServiceAreaMap({ cities, landNaam }: ServiceAreaMapProps) {
  const elRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!elRef.current || mapRef.current) return;

    const validCities = cities.filter(
      (c) => c.latitude != null && c.longitude != null,
    );
    if (validCities.length === 0) return;

    const map = L.map(elRef.current, {
      zoomControl: true,
      scrollWheelZoom: false,
    }).setView([50, 5], 5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    mapRef.current = map;

    // Depot marker
    L.marker(DEPOT, { icon: depotIcon })
      .addTo(map)
      .bindPopup('<strong>Depot Son en Breugel</strong><br/>Nederland');

    // City markers + convex hull polygon
    const bounds = L.latLngBounds([DEPOT]);
    validCities.forEach((c) => {
      const latlng: [number, number] = [Number(c.latitude), Number(c.longitude)];
      L.marker(latlng, { icon: cityIcon })
        .addTo(map)
        .bindPopup(`<strong>${c.naam}</strong><br/>${landNaam}`);
      bounds.extend(latlng);
    });

    // Service area polygon (simple bounding hull) around country cities
    if (validCities.length >= 3) {
      const pts = validCities.map<[number, number]>((c) => [
        Number(c.latitude),
        Number(c.longitude),
      ]);
      const hull = convexHull(pts);
      L.polygon(hull, {
        color: 'hsl(220,90%,35%)',
        weight: 2,
        fillOpacity: 0.08,
        dashArray: '6,4',
      }).addTo(map);
    }

    map.fitBounds(bounds, { padding: [40, 40] });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [cities, landNaam]);

  if (!cities.some((c) => c.latitude != null && c.longitude != null)) {
    return null;
  }

  return (
    <div
      ref={elRef}
      className="h-[400px] w-full rounded-xl overflow-hidden border border-border"
      aria-label={`Servicegebied kaart ${landNaam}`}
    />
  );
}

// Simple convex hull (Andrew's monotone chain)
function convexHull(points: [number, number][]): [number, number][] {
  const pts = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (pts.length <= 2) return pts;
  const cross = (
    o: [number, number],
    a: [number, number],
    b: [number, number],
  ) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: [number, number][] = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0)
      lower.pop();
    lower.push(p);
  }
  const upper: [number, number][] = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0)
      upper.pop();
    upper.push(p);
  }
  lower.pop();
  upper.pop();
  return lower.concat(upper);
}
