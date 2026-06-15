import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLand } from '@/hooks/useLand';
import { Header } from '@/components/public/Header';
import { Footer } from '@/components/public/Footer';
import { PageBreadcrumb } from '@/components/public/PageBreadcrumb';
import { SEOHead } from '@/components/SEOHead';
import { Loader2, MapPin, ArrowRight, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

const BestemmingenPage = () => {
  const { land, isHoofdsite, loading: landLoading } = useLand();

  const { data: steden, isLoading } = useQuery({
    queryKey: ['bestemmingen', land?.id],
    queryFn: async () => {
      let query = supabase
        .from('buitenland_steden')
        .select(`
          *,
          land:landen(*)
        `)
        .order('naam');

      if (land) {
        query = query.eq('land_id', land.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !landLoading,
  });

  if (landLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const siteNaam = land ? `De ${land.naam} Koerier` : 'De Europa Koerier';

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead pageKey="bestemmingen" landNaam={land?.naam} variables={{ land: land?.naam || 'Europa' }} />
      <Header landNaam={land?.naam} />
      
      <main className="flex-1 py-12">
        <div className="container">
          <PageBreadcrumb items={[{ label: 'Bestemmingen' }]} className="mb-6" />
          <h1 className="font-display text-3xl font-bold mb-2">
            {land ? `Bestemmingen in ${land.naam}` : 'Alle bestemmingen'}
          </h1>
          <p className="text-muted-foreground mb-4">
            Kies een stad om de beschikbare routes te bekijken.
          </p>

          <div className="mb-10 rounded-2xl border border-primary/20 bg-primary/5 p-6 lg:p-8">
            <h2 className="font-display text-xl lg:text-2xl font-bold text-primary">
              Dit zijn niet alle bestemmingen
            </h2>
            <p className="mt-2 text-muted-foreground max-w-3xl">
              Onderstaande steden zijn een selectie van populaire bestemmingen. <strong>Wij rijden naar elke plaats binnen heel Europa</strong>, van klein dorp tot grote stad. Staat uw bestemming er niet tussen? Vraag gewoon een vrijblijvende offerte aan, wij regelen het.
            </p>
            <div className="mt-5">
              <Button asChild size="lg">
                <Link to="/offerte">
                  <Send className="mr-2 h-4 w-4" />
                  Offerte aanvragen
                </Link>
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !steden || steden.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground">
                Nog geen bestemmingen beschikbaar.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {steden.map((stad) => (
                <Link
                  key={stad.id}
                  to={`/bestemming/${stad.slug}`}
                  className="group flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary hover:shadow-md transition-all"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display font-semibold group-hover:text-primary transition-colors">
                      {stad.naam}
                    </h3>
                    {!land && stad.land && (
                      <p className="text-sm text-muted-foreground">
                        {stad.land.naam}
                      </p>
                    )}
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default BestemmingenPage;
