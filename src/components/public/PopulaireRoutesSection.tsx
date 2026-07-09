import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ArrowRight, MapPin, Clock } from 'lucide-react';
import { Loader2 } from 'lucide-react';

export const PopulaireRoutesSection = () => {
  const { data: routes, isLoading } = useQuery({
    queryKey: ['populaire-routes-hoofdsite'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routes')
        .select(`
          id, slug, afstand_km,
          nl_plaats:nl_plaatsen(naam),
          buitenland_stad:buitenland_steden(naam, land:landen(naam, slug))
        `)
        .order('afstand_km', { ascending: true })
        .limit(9);
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <section className="py-16 bg-muted/50">
        <div className="container flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  if (!routes || routes.length === 0) return null;

  return (
    <section className="py-16 bg-muted/50">
      <div className="container">
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl font-bold">Populaire koeriersroutes</h2>
          <p className="mt-2 text-muted-foreground">
            Bekijk direct afstand, geschatte rijtijd en prijsindicatie per route
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {routes.map((route: any) => {
            const km = Number(route.afstand_km) || 0;
            const rijtijd = km / 80;
            const rijtijdLabel = rijtijd < 10
              ? `${rijtijd.toFixed(1).replace('.', ',')} uur`
              : `${Math.round(rijtijd)} uur`;
            const landSlug = route.buitenland_stad?.land?.slug;
            return (
              <Link
                key={route.id}
                to={`/spoed-koerier-${landSlug}/${route.slug}`}
                className="group p-5 rounded-xl border border-border bg-card hover:border-primary hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-2 font-display font-semibold">
                  <MapPin className="h-4 w-4 text-primary shrink-0" />
                  <span>{route.nl_plaats?.naam}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{route.buitenland_stad?.naam}</span>
                </div>
                <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{Math.round(km)} km</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> ± {rijtijdLabel}
                  </span>
                </div>
                <div className="mt-3 text-sm text-primary group-hover:underline">
                  Bekijk route &rarr;
                </div>
              </Link>
            );
          })}
        </div>

        <div className="text-center mt-8">
          <Link to="/bestemmingen" className="text-primary hover:underline font-medium">
            Bekijk alle bestemmingen &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
};
