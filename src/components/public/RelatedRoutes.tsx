import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, ArrowRight } from 'lucide-react';

interface Props {
  currentRouteId: string;
  nlPlaatsId: string;
  nlPlaatsNaam: string;
  landId: string;
  landNaam: string;
  landSlug: string;
}

interface RouteRow {
  id: string;
  slug: string;
  afstand_km: number;
  geschatte_prijs: number;
  nl_plaats: { naam: string } | null;
  buitenland_stad: { naam: string } | null;
}

export function RelatedRoutes({ currentRouteId, nlPlaatsId, nlPlaatsNaam, landId, landNaam, landSlug }: Props) {
  const [vanuitStad, setVanuitStad] = useState<RouteRow[]>([]);
  const [naarLand, setNaarLand] = useState<RouteRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Andere bestemmingen in dit land — alle routes naar steden van dit land
      const { data: stedenLand } = await supabase
        .from('buitenland_steden')
        .select('id')
        .eq('land_id', landId);
      const stedenIds = (stedenLand || []).map((s) => s.id);

      const [{ data: vanuit }, { data: naarL }] = await Promise.all([
        supabase
          .from('routes')
          .select('id, slug, afstand_km, geschatte_prijs, nl_plaats:nl_plaatsen(naam), buitenland_stad:buitenland_steden(naam)')
          .eq('nl_plaats_id', nlPlaatsId)
          .neq('id', currentRouteId)
          .limit(6),
        stedenIds.length
          ? supabase
              .from('routes')
              .select('id, slug, afstand_km, geschatte_prijs, nl_plaats:nl_plaatsen(naam), buitenland_stad:buitenland_steden(naam)')
              .in('buitenland_stad_id', stedenIds)
              .neq('id', currentRouteId)
              .neq('nl_plaats_id', nlPlaatsId)
              .limit(6)
          : { data: [] as RouteRow[] },
      ]);

      if (cancelled) return;
      setVanuitStad((vanuit as unknown as RouteRow[]) || []);
      setNaarLand((naarL as unknown as RouteRow[]) || []);
    })();
    return () => { cancelled = true; };
  }, [currentRouteId, nlPlaatsId, landId]);

  if (vanuitStad.length === 0 && naarLand.length === 0) return null;

  const renderCard = (r: RouteRow) => (
    <Link
      key={r.id}
      to={`/spoed-koerier-${landSlug}/${r.slug}`}
      className="group flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary hover:shadow-md transition-all"
    >
      <MapPin className="h-4 w-4 text-primary shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">
          {r.nl_plaats?.naam} <ArrowRight className="inline h-3 w-3 mx-1" /> {r.buitenland_stad?.naam}
        </p>
        <p className="text-xs text-muted-foreground">
          {Math.round(Number(r.afstand_km))} km · vanaf € {Math.round(Number(r.geschatte_prijs)).toLocaleString('nl-NL')}
        </p>
      </div>
    </Link>
  );

  return (
    <section className="py-12 bg-muted/30 border-t">
      <div className="container space-y-10">
        {vanuitStad.length > 0 && (
          <div>
            <h2 className="font-display text-2xl font-bold mb-4">
              Ook populair vanuit {nlPlaatsNaam}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {vanuitStad.map(renderCard)}
            </div>
          </div>
        )}

        {naarLand.length > 0 && (
          <div>
            <h2 className="font-display text-2xl font-bold mb-4">
              Andere bestemmingen in {landNaam}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {naarLand.map(renderCard)}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
