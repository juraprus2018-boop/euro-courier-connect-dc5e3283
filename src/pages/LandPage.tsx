// React imports niet meer nodig — SEO via <SEOHead />
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
import { AnimatedLeafletRouteMap } from '@/components/public/AnimatedLeafletRouteMap';
import RouteMap from '@/components/public/RouteMap';
import { formatPrijsRange } from '@/lib/prijs';
import { SmartCTA } from '@/components/public/SmartCTA';
import { SEOHead } from '@/components/SEOHead';

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
        .select('id, naam, slug, latitude, longitude')
        .eq('land_id', land!.id)
        .order('naam');
      if (error) throw error;
      return data;
    },
    enabled: !!land?.id,
  });

  // Gemiddelde afstand/prijs van populaire routes naar dit land — voor SmartCTA
  const { data: routeStats } = useQuery({
    queryKey: ['land-route-stats', land?.id],
    queryFn: async () => {
      const { data: stedenIds } = await supabase
        .from('buitenland_steden')
        .select('id')
        .eq('land_id', land!.id);
      if (!stedenIds?.length) return null;
      const { data: routes } = await supabase
        .from('routes')
        .select('afstand_km, geschatte_prijs')
        .in('buitenland_stad_id', stedenIds.map((s) => s.id));
      if (!routes?.length) return null;
      const avgKm = routes.reduce((a, r) => a + Number(r.afstand_km || 0), 0) / routes.length;
      const minPrijs = Math.min(...routes.map((r) => Number(r.geschatte_prijs || 0)).filter((n) => n > 0));
      return { avgKm, minPrijs: isFinite(minPrijs) ? minPrijs : undefined };
    },
    enabled: !!land?.id,
  });

  // Top routes naar dit land (kortste afstand eerst — meest gevraagd)
  const { data: topRoutes } = useQuery({
    queryKey: ['land-top-routes', land?.id],
    queryFn: async () => {
      const { data: stedenIds } = await supabase
        .from('buitenland_steden')
        .select('id')
        .eq('land_id', land!.id);
      if (!stedenIds?.length) return [];
      const { data } = await supabase
        .from('routes')
        .select('id, slug, afstand_km, geschatte_prijs, nl_plaats:nl_plaatsen(naam), buitenland_stad:buitenland_steden(naam)')
        .in('buitenland_stad_id', stedenIds.map((s) => s.id))
        .order('afstand_km', { ascending: true })
        .limit(12);
      return data || [];
    },
    enabled: !!land?.id,
  });

  // SEO wordt nu volledig door <SEOHead /> afgehandeld (zie return JSX hieronder).



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

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const pageUrl = `${origin}/spoedkoerier-naar/${land.slug}`;

  // FAQ items voor structured data
  const faqItems = [
    {
      q: `Hoe snel kan een spoedkoerier naar ${naam} vertrekken?`,
      a: `Onze spoedkoerier naar ${naam} kan in de meeste gevallen binnen 60 minuten na uw aanvraag vertrekken vanuit Nederland. Wij zijn 24/7 bereikbaar, ook in het weekend en op feestdagen.`,
    },
    {
      q: `Wat is de leveringstijd naar ${naam}?`,
      a: `De rijtijd vanuit Nederland naar ${naam} bedraagt afhankelijk van de exacte bestemming circa 14 tot 18 uur directe rit. Wij rijden non-stop met twee chauffeurs wanneer dit nodig is.`,
    },
    {
      q: `Wat moet ik aanleveren voor een rit naar ${naam}?`,
      a: `Voor een vlotte rit naar ${naam} ontvangen wij graag: ophaal- en afleveradres, contactpersoon, afmetingen en gewicht van de zending, omschrijving van de inhoud en eventuele douanedocumenten of CMR-vrachtbrief.`,
    },
    {
      q: `Is mijn zending naar ${naam} verzekerd?`,
      a: `Ja, elke spoedrit naar ${naam} is standaard CMR-verzekerd. Voor zendingen met hogere waarde regelen wij op verzoek aanvullende goederenverzekering.`,
    },
  ];

  // JSON-LD: Service, BreadcrumbList, FAQPage
  const serviceLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: `Spoedkoerier naar ${naam}`,
    name: `Spoedkoerier naar ${naam}`,
    description: `Spoedkoerier en koeriersdienst van Nederland naar ${naam}. Dagelijkse directe ritten, één vaste chauffeur, 24/7 beschikbaar.`,
    url: pageUrl,
    provider: {
      '@type': 'LocalBusiness',
      '@id': `${origin}/#organization`,
      name: CONTACT.bedrijf,
      telephone: CONTACT.telefoon,
      email: CONTACT.email,
      address: {
        '@type': 'PostalAddress',
        streetAddress: CONTACT.adres,
        postalCode: CONTACT.postcode,
        addressLocality: CONTACT.plaats,
        addressCountry: 'NL',
      },
    },
    areaServed: [
      { '@type': 'Country', name: 'Netherlands' },
      { '@type': 'Country', name: naam },
    ],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: `Spoedkoerier ritten naar ${naam}`,
      itemListElement: (topRoutes || []).slice(0, 6).map((r: any) => ({
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: `Spoedkoerier ${r.nl_plaats?.naam} naar ${r.buitenland_stad?.naam}`,
          url: `${origin}/route/${r.slug}`,
        },
      })),
    },
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: origin || '/' },
      { '@type': 'ListItem', position: 2, name: 'Bestemmingen', item: `${origin}/bestemmingen` },
      { '@type': 'ListItem', position: 3, name: naam, item: pageUrl },
    ],
  };

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        pageKey="land_detail"
        landNaam={naam}
        variables={{ land: naam }}
        canonicalPath={`/spoedkoerier-naar/${land.slug}`}
        jsonLd={[serviceLd, breadcrumbLd, faqLd]}
      />
      <Header landNaam={activeLand?.naam} />


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

      {/* Geanimeerde Leaflet kaart Eindhoven → bestemming */}
      {(() => {
        const target = steden?.find((s) => s.latitude != null && s.longitude != null);
        if (!target) return null;
        return (
          <section className="py-12 bg-background">
            <div className="container">
              <div className="mb-4">
                <h2 className="font-display text-xl md:text-2xl font-bold">
                  Route Nederland → {naam}
                </h2>
                <p className="text-muted-foreground text-sm">
                  Directe rit vanuit Eindhoven naar {target.naam} ({naam}), één chauffeur, zonder overslag.
                </p>
              </div>
              <AnimatedLeafletRouteMap
                toName={`${target.naam} (${naam})`}
                toLat={Number(target.latitude)}
                toLng={Number(target.longitude)}
              />
            </div>
          </section>
        );
      })()}

      {/* SEO content */}
      <section className="py-12 bg-muted/30">
        <div className="container">
          <div className="max-w-4xl mr-auto">
          <h2 className="font-display text-xl md:text-2xl font-bold mb-4">
            De {naam} Koerier: uw vaste partner voor spoedritten naar {naam}
          </h2>
          <div className="prose prose-slate max-w-none text-foreground text-[18px] leading-relaxed">
            <p>
              Een <strong>spoedkoerier naar {naam}</strong> regelen is bij De {naam} Koerier
              een kwestie van bellen of een offerte aanvragen. Wij zijn een Nederlands
              koeriersbedrijf dat zich volledig richt op directe ritten tussen Nederland
              en {naam}. Geen Europees algemeen verhaal, maar chauffeurs en planners die
              de weg naar {naam} kennen: van de Nederlandse oprit tot het laad- en losadres
              in {naam} zelf.
            </p>
            <p>
              Wij rijden iedere werkdag, en op afroep ook 's nachts en in het weekend,
              vanuit elke Nederlandse postcode naar {naam}. Doordat wij ons specialiseren
              in deze corridor weten onze chauffeurs precies wanneer er drukte is bij de
              grensovergangen, welke routes binnen {naam} het snelst zijn en waar onderweg
              tijd te winnen valt. Dat scheelt vaak uren ten opzichte van een algemene
              koerier die heel Europa bedient.
            </p>

            <h2 className="font-display font-semibold mt-8 mb-3">
              Wanneer kiest u voor een spoedkoerier naar {naam}?
            </h2>
            <p>
              Onze klanten boeken een <strong>spoeddienst naar {naam}</strong> vooral
              wanneer een vertraging direct geld kost. Denk aan een productielijn in {naam}
              die stilstaat door een ontbrekend reserveonderdeel, een prototype dat morgen
              op een beurs in {naam} moet staan, juridische documenten die voor sluitingstijd
              ondertekend moeten zijn, of medische monsters die binnen een strak tijdvenster
              in een laboratorium in {naam} moeten worden afgeleverd. In al die gevallen
              vertrekt onze <strong>koerier met spoed naar {naam}</strong> direct na uw
              opdracht.
            </p>
            <p>
              Wij vervoeren naar {naam} onder andere:
            </p>
            <ul>
              <li>Reserveonderdelen voor productie en machinebouw in {naam}</li>
              <li>Medische monsters en farmaceutische zendingen naar {naam}se laboratoria en ziekenhuizen</li>
              <li>Juridische en zakelijke documenten met een harde deadline in {naam}</li>
              <li>Kunst, antiek en waardevolle objecten richting {naam}</li>
              <li>Prototypes, beursmateriaal en showroommodellen voor evenementen in {naam}</li>
              <li>Temperatuurgevoelige producten die zonder overslag in {naam} moeten aankomen</li>
            </ul>

            <h2 className="font-display font-semibold mt-8 mb-3">
              Waarom De {naam} Koerier en niet zomaar een Europese koerier?
            </h2>
            <p>
              Het verschil zit in focus. Wij rijden dagelijks op {naam} en kennen de
              bijzonderheden van deze bestemming: rij- en rusttijden voor de heenrit,
              tolwegen onderweg, taal en gewoonten bij ontvangst, en de bereikbaarheid
              van afgelegen industrieterreinen in {naam}. U krijgt een vaste prijs vooraf,
              één vast aanspreekpunt, een eigen wagenpark zonder onderaannemers, volledige
              goederenverzekering en een directe deur-tot-deur levering in {naam}.
            </p>
            <p>
              Vraag direct uw offerte aan voor een <strong>koerier met spoed naar {naam}</strong>
              of bel ons voor persoonlijk advies. Wij denken graag mee over de snelste en
              meest efficiënte route voor uw zending richting {naam}.
            </p>
          </div>

          {/* Steden */}
          {steden && steden.length > 0 && (
            <div className="mt-10">
              <h2 className="font-display font-semibold mb-2">
                Bestemmingen in {naam}
              </h2>
              <p className="text-muted-foreground mb-4">
                Wij rijden naar <strong>alle plekken in {naam}</strong>, van grote steden tot
                kleine dorpen. Hieronder ziet u een aantal populaire bestemmingen waar wij
                regelmatig naartoe rijden:
              </p>
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

          {/* Top routes */}
          {topRoutes && topRoutes.length > 0 && (
            <div className="mt-10">
              <h2 className="font-display font-semibold mb-2">
                Top routes naar {naam}
              </h2>
              <p className="text-muted-foreground mb-4">
                Een overzicht van veelgevraagde routes vanuit Nederland naar {naam}, inclusief
                indicatieve afstand en prijs. Heeft uw stad er niet bij staan? Geen probleem,
                wij rijden vanaf elke locatie in Nederland.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {topRoutes.map((r: any) => (
                  <Link
                    key={r.id}
                    to={`/route/${r.slug}`}
                    className="group flex items-center justify-between gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <MapPin className="h-4 w-4 text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">
                          {r.nl_plaats?.naam} <ArrowRight className="inline h-3 w-3 mx-1" /> {r.buitenland_stad?.naam}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Indicatie {formatPrijsRange(Number(r.geschatte_prijs)) ?? 'op aanvraag'}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {externalUrl && isHoofdsite && (
            <div className="mt-10 p-6 rounded-xl border border-primary/20 bg-primary/5">
              <h2 className="font-display font-semibold mb-2">
                Specialist voor {naam}: {land.domein}
              </h2>
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
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12">
        <div className="container">
          <div className="max-w-4xl mr-auto">
            <h2 className="font-display text-xl md:text-2xl font-bold mb-6">
              Veelgestelde vragen over een spoedkoerier naar {naam}
            </h2>
            <div className="space-y-4">
              {[
                {
                  q: `Hoe snel kan een spoedkoerier naar ${naam} vertrekken?`,
                  a: `Onze spoedkoerier naar ${naam} kan in de meeste gevallen binnen 60 minuten na uw aanvraag vertrekken vanuit Nederland. Wij zijn 24/7 bereikbaar, ook in het weekend en op feestdagen.`,
                },
                {
                  q: `Wat is de leveringstijd naar ${naam}?`,
                  a: `De rijtijd vanuit Nederland naar ${naam} bedraagt afhankelijk van de exacte bestemming circa 14 tot 18 uur directe rit. Wij rijden non-stop met twee chauffeurs wanneer dit nodig is, zodat uw zending zo snel mogelijk wordt afgeleverd.`,
                },
                {
                  q: `Wat moet ik aanleveren voor een rit naar ${naam}?`,
                  a: `Voor een vlotte rit naar ${naam} ontvangen wij graag: het ophaal- en afleveradres met contactpersoon en telefoonnummer, afmetingen en gewicht van de zending, een korte omschrijving van de inhoud en eventuele douanedocumenten of CMR-vrachtbrief. Wij regelen de rest.`,
                },
              ].map((item, i) => (
                <details key={i} className="group rounded-lg border border-border bg-card p-4">
                  <summary className="cursor-pointer font-semibold text-foreground list-none flex items-center justify-between gap-2">
                    <span>{item.q}</span>
                    <span className="text-primary group-open:rotate-180 transition-transform">▾</span>
                  </summary>
                  <p className="mt-3 text-foreground/80 text-[16px] leading-relaxed">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Smart, gepersonaliseerde CTA op basis van populaire routes naar dit land */}
      <section className="py-12">
        <div className="container">
          <SmartCTA
            afstandKm={routeStats?.avgKm}
            prijsVanaf={routeStats?.minPrijs}
            bestemming={naam}
            variant="wide"
          />
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandPage;
