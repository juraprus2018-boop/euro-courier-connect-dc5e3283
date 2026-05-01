import { useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLand } from '@/hooks/useLand';
import { Header } from '@/components/public/Header';
import { Footer } from '@/components/public/Footer';
import { PageBreadcrumb } from '@/components/public/PageBreadcrumb';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, ArrowRight, Truck, Clock, ShieldCheck, Phone } from 'lucide-react';
import { CONTACT } from '@/lib/contact';

const LandPage = () => {
  const { landSlug } = useParams<{ landSlug: string }>();
  const { land: activeLand, isHoofdsite, loading: landLoading } = useLand();

  const { data: land, isLoading } = useQuery({
    queryKey: ['land-page', landSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('landen')
        .select('*')
        .eq('slug', landSlug)
        .eq('actief', true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!landSlug,
  });

  const { data: steden } = useQuery({
    queryKey: ['land-steden', land?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('buitenland_steden')
        .select('id, naam, slug')
        .eq('land_id', land!.id)
        .order('naam');
      if (error) throw error;
      return data;
    },
    enabled: !!land?.id,
  });

  // SEO meta tags
  useEffect(() => {
    if (!land) return;
    const title = land.meta_title || `Spoedkoerier naar ${land.naam} | Direct beschikbaar`;
    const desc =
      land.meta_description ||
      `Spoedkoerier naar ${land.naam} nodig? Wij rijden dagelijks vanuit Nederland naar ${land.naam}. Snelle levering, scherpe tarieven en directe offerte.`;
    document.title = title;
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', desc);

    // canonical
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', `${window.location.origin}/spoedkoerier-naar/${land.slug}`);
  }, [land]);

  if (landLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // On country-specific subdomains we don't want these landenpagina's voor andere landen
  if (!isHoofdsite && activeLand && land && activeLand.id !== land.id) {
    return <Navigate to="/" replace />;
  }

  if (!land) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header landNaam={activeLand?.naam} />
        <main className="flex-1 py-20 container text-center">
          <h1 className="font-display text-2xl font-bold mb-4">Land niet gevonden</h1>
          <Link to="/bestemmingen" className="text-primary hover:underline">
            Bekijk alle bestemmingen
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const naam = land.naam;
  const externalUrl = land.domein ? `https://${land.domein.replace(/^https?:\/\//, '')}` : null;

  // JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `Spoedkoerier naar ${naam}`,
    description: `Spoedkoerier en koeriersdienst van Nederland naar ${naam}. Dagelijkse ritten, directe levering.`,
    provider: {
      '@type': 'Organization',
      name: 'De Europa Koerier',
      telephone: CONTACT.telefoon,
      email: CONTACT.email,
    },
    areaServed: { '@type': 'Country', name: naam },
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header landNaam={activeLand?.naam} />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <section className="bg-gradient-hero text-primary-foreground py-16">
        <div className="container">
          <PageBreadcrumb
            items={[
              { label: 'Bestemmingen', to: '/bestemmingen' },
              { label: naam },
            ]}
            className="mb-6 text-primary-foreground/80"
          />
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Spoedkoerier naar {naam}
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/90 max-w-3xl mb-8">
            {land.hero_subtitel ||
              `Heeft u een dringende zending naar ${naam}? Wij rijden dagelijks vanuit Nederland naar ${naam} met directe spoedkoerier­diensten. Snel, betrouwbaar en zonder overslag.`}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-cta text-cta-foreground hover:brightness-110 shadow-cta animate-cta-pulse">
              <Link to="/offerte">
                Offerte aanvragen <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
              <a href={CONTACT.telefoonHref}>
                <Phone className="mr-2 h-4 w-4" /> {CONTACT.telefoon}
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Voordelen */}
      <section className="py-12 bg-background">
        <div className="container grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Clock, titel: 'Direct beschikbaar', tekst: `Binnen 1 uur onderweg naar ${naam}.` },
            { icon: Truck, titel: 'Eigen wagenpark', tekst: 'Geen overslag, één chauffeur, één rit.' },
            { icon: ShieldCheck, titel: 'Volledig verzekerd', tekst: 'Track & trace en goederenverzekering inbegrepen.' },
          ].map((v) => (
            <div key={v.titel} className="rounded-xl border border-border p-6 bg-card">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                <v.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display text-lg font-semibold mb-2">{v.titel}</h3>
              <p className="text-muted-foreground text-sm">{v.tekst}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SEO content */}
      <section className="py-12 bg-muted/30">
        <div className="container">
          <div className="max-w-4xl mr-auto">
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">
            Wij rijden naar {naam} – elke dag opnieuw
          </h2>
          <div className="prose prose-slate max-w-none text-foreground">
            <p>
              Onze koeriers rijden dagelijks vanuit Nederland naar {naam}. Of het nu gaat
              om een <strong>spoedkoerier naar {naam}</strong>, een geplande zakelijke levering
              of een gevoelig medisch transport: wij regelen het direct. Met onze ervaren
              chauffeurs en een eigen wagenpark bent u verzekerd van een snelle, veilige
              en directe rit zonder tussenstops.
            </p>
            <p>
              Een <strong>koerier naar {naam}</strong> boeken via De Europa Koerier betekent:
              één vast contactpersoon, transparante kilometerprijs en realtime track & trace.
              U weet exact waar uw zending zich bevindt, vanaf het moment van ophalen tot
              aflevering op de eindbestemming in {naam}.
            </p>
            <p>
              Veel klanten kiezen voor onze <strong>spoeddienst naar {naam}</strong> voor
              dringende reserveonderdelen, prototypes, juridische documenten of medische
              monsters. Wij vervoeren ook kunst, machines en temperatuurgevoelige goederen.
            </p>
          </div>

          {/* Steden */}
          {steden && steden.length > 0 && (
            <div className="mt-10">
              <h3 className="font-display text-xl font-semibold mb-4">
                Bestemmingen in {naam}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {steden.map((s) => (
                  <Link
                    key={s.id}
                    to={`/bestemming/${s.slug}`}
                    className="flex items-center gap-2 p-3 rounded-lg border border-border bg-card hover:border-primary hover:shadow-sm transition-all text-sm"
                  >
                    <MapPin className="h-4 w-4 text-primary shrink-0" />
                    <span className="truncate">{s.naam}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {externalUrl && isHoofdsite && (
            <div className="mt-10 p-6 rounded-xl border border-primary/20 bg-primary/5">
              <h3 className="font-display text-lg font-semibold mb-2">
                Specialist voor {naam}: {land.domein}
              </h3>
              <p className="text-muted-foreground text-sm mb-4">
                Bezoek onze specialistische website voor {naam} met lokale tarieven en routes.
              </p>
              <Button asChild variant="outline">
                <a href={externalUrl} target="_blank" rel="noopener">
                  Naar {land.domein} <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-hero text-primary-foreground">
        <div className="container text-center">
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">
            Direct een spoedkoerier naar {naam} regelen?
          </h2>
          <p className="text-primary-foreground/90 mb-6 max-w-2xl mx-auto">
            Bereken in minder dan een minuut uw prijs of bel ons direct.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button asChild size="lg" className="bg-cta text-cta-foreground hover:brightness-110 shadow-cta animate-cta-pulse">
              <Link to="/offerte">
                Offerte aanvragen <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
              <a href={CONTACT.telefoonHref}>
                <Phone className="mr-2 h-4 w-4" /> Bel direct
              </a>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandPage;
