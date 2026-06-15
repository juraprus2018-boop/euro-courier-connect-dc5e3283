import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Loader2, Search } from 'lucide-react';

export interface PlaceResult {
  naam: string;
  lat: number;
  lon: number;
  display: string;
}

interface PlaceSearchProps {
  countryCode: string; // ISO 3166-1 alpha-2, e.g. 'nl', 'hr'
  placeholder?: string;
  onSelect: (place: PlaceResult) => void;
  disabled?: boolean;
}

export const PlaceSearch = ({ countryCode, placeholder, onSelect, disabled }: PlaceSearchProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&countrycodes=${countryCode.toLowerCase()}&format=json&limit=10&addressdetails=1&accept-language=nl`;
        const res = await fetch(url, { signal: ctrl.signal, headers: { 'Accept': 'application/json' } });
        const data = await res.json();
        const mapped: PlaceResult[] = (data || [])
          .filter((r: any) => ['city', 'town', 'village', 'municipality', 'suburb', 'hamlet', 'administrative'].includes(r.type) || r.class === 'place' || r.class === 'boundary')
          .map((r: any) => {
            const a = r.address || {};
            const naam = a.city || a.town || a.village || a.municipality || a.hamlet || a.suburb || r.name || (r.display_name || '').split(',')[0];
            return { naam, lat: Number(r.lat), lon: Number(r.lon), display: r.display_name };
          });
        // de-dupe by naam
        const seen = new Set<string>();
        setResults(mapped.filter((p) => p.naam && !seen.has(p.naam.toLowerCase()) && seen.add(p.naam.toLowerCase())));
        setOpen(true);
      } catch (e) {
        if ((e as any).name !== 'AbortError') console.error(e);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => { ctrl.abort(); clearTimeout(timer); };
  }, [query, countryCode]);

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder || 'Zoek plaats...'}
          className="pl-10"
          disabled={disabled}
          onFocus={() => results.length > 0 && setOpen(true)}
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full max-h-72 overflow-auto rounded-md border bg-popover shadow-lg">
          {results.map((r, i) => (
            <button
              key={`${r.naam}-${i}`}
              type="button"
              className="block w-full text-left px-3 py-2 text-sm hover:bg-accent border-b last:border-b-0"
              onClick={() => {
                onSelect(r);
                setQuery('');
                setResults([]);
                setOpen(false);
              }}
            >
              <div className="font-medium">{r.naam}</div>
              <div className="text-xs text-muted-foreground truncate">{r.display}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
