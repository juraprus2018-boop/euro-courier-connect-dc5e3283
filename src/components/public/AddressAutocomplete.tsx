import { useEffect, useRef, useState } from 'react';
import { Loader2, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface AddressSuggestion {
  display_name: string;
  road?: string;
  house_number?: string;
  postcode?: string;
  city?: string;
  country?: string;
}

interface AddressAutocompleteProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onSelect?: (suggestion: AddressSuggestion) => void;
  placeholder?: string;
  className?: string;
  /** Comma-separated ISO country codes to limit results, e.g. "nl" or "fr,be" */
  countryCodes?: string;
}

export function AddressAutocomplete({
  id,
  value,
  onChange,
  onSelect,
  placeholder,
  className,
  countryCodes,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<number | null>(null);
  const lastSelectedRef = useRef<string>('');

  useEffect(() => {
    if (lastSelectedRef.current === value) return;
    if (!value || value.trim().length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      setLoading(true);
      try {
        const cc = countryCodes ? `&countrycodes=${encodeURIComponent(countryCodes.toLowerCase())}` : '';
        const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=6&q=${encodeURIComponent(value)}${cc}`;
        const res = await fetch(url, { headers: { 'Accept-Language': 'nl' } });
        const data = await res.json();
        setSuggestions(Array.isArray(data) ? data : []);
        setOpen(true);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [value, countryCodes]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handlePick = (s: any) => {
    const addr = s.address || {};
    const street = [addr.road, addr.house_number].filter(Boolean).join(' ');
    const display = street || s.display_name.split(',')[0];
    lastSelectedRef.current = display;
    onChange(display);
    setOpen(false);
    onSelect?.({
      display_name: s.display_name,
      road: addr.road,
      house_number: addr.house_number,
      postcode: addr.postcode,
      city:
        addr.city ||
        addr.town ||
        addr.village ||
        addr.municipality ||
        addr.hamlet ||
        addr.suburb ||
        addr.county,
      country: addr.country,
    });
  };

  return (
    <div ref={wrapperRef} className="relative">
      <Input
        id={id}
        value={value}
        onChange={(e) => {
          lastSelectedRef.current = '';
          onChange(e.target.value);
        }}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />
      {loading && (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
      )}
      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full max-h-64 overflow-auto rounded-md border bg-popover text-popover-foreground shadow-lg">
          {suggestions.map((s, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => handlePick(s)}
                className={cn(
                  'flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground',
                )}
              >
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <span className="line-clamp-2">{s.display_name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
