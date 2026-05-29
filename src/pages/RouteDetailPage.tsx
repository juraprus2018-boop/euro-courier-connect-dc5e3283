import { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Header } from '@/components/public/Header';
import { Footer } from '@/components/public/Footer';
import { QuoteForm } from '@/components/public/QuoteForm';
import { PageBreadcrumb } from '@/components/public/PageBreadcrumb';
import { SEOHead } from '@/components/SEOHead';
import { RouteFAQ } from '@/components/public/RouteFAQ';
import { RelatedRoutes } from '@/components/public/RelatedRoutes';
import { SmartCTA } from '@/components/public/SmartCTA';
import { buildRouteFaq, faqJsonLd, breadcrumbJsonLd, serviceJsonLd } from '@/lib/seo';
import { formatPrijsRange } from '@/lib/prijs';
import { supabase } from '@/integrations/supabase/client';
import { useLand } from '@/hooks/useLand';
import { Loader2, MapPin, ArrowRight, Truck, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface RouteDetail {
  id: string;
  afstand_km: number;
  geschatte_prijs: number;
  nl_plaats: { id: string; naam: string };
  buitenland_stad: { id: string; naam: string; land: { id: string; naam: string; slug: string } };
}

const RouteDetailPage = () => {
  const { slug, landPrefix } = useParams();
  const landSlug = landPrefix?.startsWith('spoed-koerier-') ? landPrefix.slice('spoed-koerier-'.length) : undefined;
  const { land, loading: landLoading } = useLand();
  const [route, setRoute] = useState<RouteDetail | null>(null);
  const [kmTarief, setKmTarief] = useState<number>(0.7);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoute = async () => {
      if (!slug) return;

      const [{ data, error }, tariefRes] = await Promise.all([
        supabase
          .from('routes')
          .select(`
            id,
            afstand_km,
            geschatte_prijs,
            nl_plaats:nl_plaatsen(id, naam),
            buitenland_stad:buitenland_steden(id, naam, land:landen(id, naam, slug))
          `)
          .eq('slug', slug)
          .maybeSingle(),
        supabase
          .from('instellingen')
          .select('waarde')
          .eq('sleutel', 'km_tarief_bestelwagen')
          .maybeSingle(),
      ]);


      if (error) {
        console.error('Error fetching route:', error);
      } else {
        setRoute(data as unknown as RouteDetail);
      }
      if (tariefRes.data?.waarde) {
        const n = parseFloat(String(tariefRes.data.waarde));
        if (!isNaN(n)) setKmTarief(n);
      }

      setLoading(false);
    };

    fetchRoute();
  }, [slug]);

  if (loading || landLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Canonical URL: /spoed-koerier-{landSlug}/{routeSlug}
  const canonicalLandSlug = route?.buitenland_stad?.land?.slug;
  if (route && canonicalLandSlug && landSlug !== canonicalLandSlug) {
    return <Navigate to={`/spoed-koerier-${canonicalLandSlug}/${slug}`} replace />;
  }

  // On a country-specific site, only show routes that go to that country
  const wrongLand = land && route && route.buitenland_stad?.land?.id !== land.id;

  if (!route || wrongLand) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="font-display text-2xl font-bold">Route niet gevonden</h1>
            <p className="text-muted-foreground mt-2">Deze route bestaat niet of is niet meer beschikbaar.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const nlPlaats = route.nl_plaats?.naam || '';
  const buitenlandStad = route.buitenland_stad?.naam || '';
  const landNaam = route.buitenland_stad?.land?.naam || '';
  const canonicalSlug = route.buitenland_stad?.land?.slug || '';

  const km = Number(route.afstand_km) || 0;
  const prijsBestelwagen = Math.round(km * kmTarief);
  const faq = buildRouteFaq({ nlPlaats, buitenlandStad, landNaam, afstandKm: km, prijsBestelwagen });
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const pagePath = `/spoed-koerier-${canonicalSlug}/${slug}`;
  const ldArr = [
    faqJsonLd(faq),
    breadcrumbJsonLd([
      { name: 'Home', url: `${origin}/` },
      { name: 'Routes', url: `${origin}/bestemmingen` },
      { name: `${nlPlaats} → ${buitenlandStad}`, url: `${origin}${pagePath}` },
    ]),
    serviceJsonLd({ nlPlaats, buitenlandStad, landNaam, prijsVanaf: prijsBestelwagen, url: `${origin}${pagePath}` }),
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        pageKey="route_detail"
        title={`Spoedkoerier ${nlPlaats} naar ${buitenlandStad} | Koerier naar ${buitenlandStad} (${landNaam})`}
        description={`Spoedkoerier van ${nlPlaats} naar ${buitenlandStad} (${landNaam}). Direct, 24/7, één chauffeur. Vraag nu uw koerier naar ${buitenlandStad} aan.`}
        landNaam={landNaam}
        variables={{ nl_plaats: nlPlaats, buitenland_stad: buitenlandStad, land: landNaam, afstand: Math.round(km) }}
        jsonLd={ldArr}
      />
      <Header landNaam={landNaam} />
      
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-dark py-16 text-primary-foreground">
          <div className="container">
            <PageBreadcrumb
              items={[
                { label: 'Routes', to: '/routes' },
                { label: `${nlPlaats} → ${buitenlandStad}` },
              ]}
              className="mb-6 text-primary-foreground/80 [&_a:hover]:text-primary-foreground [&_[aria-current]]:text-primary-foreground"
            />
            <div className="flex items-center gap-4 text-lg mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                <span className="font-semibold">{nlPlaats}</span>
              </div>
              <ArrowRight className="h-5 w-5" />
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                <span className="font-semibold">{buitenlandStad}</span>
              </div>
            </div>

            <h1 className="font-display text-3xl md:text-4xl font-bold">
              Spoedkoerier {nlPlaats} naar {buitenlandStad}
            </h1>
            <p className="mt-2 text-primary-foreground/90 font-semibold">
              Koerier naar {buitenlandStad} – {landNaam}
            </p>
            <p className="mt-3 text-primary-foreground/80 max-w-2xl">
              Spoedkoerier van {nlPlaats} naar {buitenlandStad} ({landNaam}). Eén chauffeur, één auto, rechtstreeks naar het afleveradres.
            </p>
          </div>
        </section>


        {/* Route Info */}
        <section className="py-12">
          <div className="container">
            <div className="grid md:grid-cols-2 gap-6 mb-12">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <Truck className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Afstand</p>
                      <p className="font-display text-2xl font-bold">{Number(route.afstand_km).toLocaleString('nl-NL')} km</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
                      <Clock className="h-6 w-6 text-success" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Levertijd</p>
                      <p className="font-display text-2xl font-bold">24-48 uur</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-12">
              <div className="space-y-6">
                <h2 className="font-display text-2xl font-bold">
                  Koerier van {nlPlaats} naar {buitenlandStad}, {landNaam}
                </h2>
                <p className="text-muted-foreground">
                  U heeft een zending die met spoed van {nlPlaats} naar {buitenlandStad} in {landNaam} moet,
                  of juist van {buitenlandStad} naar {nlPlaats}. Ontspan! Wij nemen al uw zorgen weg.
                  Wij komen de zending direct bij u ophalen en brengen die zonder omwegen direct naar
                  uw bestemming in {buitenlandStad} – {landNaam}. Een snellere optie zult u niet vinden.
                </p>

                {(() => {
                  const km = Number(route.afstand_km) || 0;
                  const prijsBestelwagen = Math.round(km * kmTarief);
                  const fmt = (n: number) => formatPrijsRange(n) ?? 'op aanvraag';

                  return (
                    <div className="space-y-6">
                      <div>
                        <h3 className="font-display text-xl font-bold mb-2">
                          Prijsindicatie bestelwagen: {fmt(prijsBestelwagen)} excl. BTW
                        </h3>
                        <p className="text-muted-foreground">
                          Voor het vervoer van een enveloppe, doosje of 1 pallet, gebruiken wij een
                          Mercedes Citan. Deze bestelwagen van Mercedes heeft een laadruimte van
                          200cm x 145cm x 115cm (L/B/H). De zending mag maximaal 618 kg wegen.
                          Voldoet uw zending aan bovenstaande maten en gewichten, bestel dan nu uw
                          bestelwagen van {nlPlaats} naar {buitenlandStad} in {landNaam}.
                        </p>
                      </div>

                      <div>
                        <h3 className="font-display text-xl font-bold mb-2">
                          Bakwagen met laadklep: prijs op aanvraag
                        </h3>
                        <p className="text-muted-foreground">
                          Voor het transport van groter formaat, zetten wij een bakwagen in. Deze
                          bakwagen met laadklep kan maximaal 8 europallets vervoeren waarbij het
                          gewicht maximaal 870 kg mag zijn. De laadruimte is 440cm x 215cm x 208cm
                          (L/B/H). Door beperkte beschikbaarheid (tachograaf-plicht) ontvangt u
                          voor een bakwagen van {nlPlaats} naar {buitenlandStad} – {landNaam} een
                          prijs op maat. Vraag een offerte aan of bel ons direct.
                        </p>
                      </div>

                      <p className="text-xs text-muted-foreground italic">
                        Aan deze berekening kunnen geen rechten worden ontleend. Prijzen zijn
                        exclusief 21% BTW en eventuele tol en veerdiensten.
                      </p>
                    </div>
                  );
                })()}


                <div>
                  <h3 className="font-display text-xl font-bold mb-2">
                    Directe levering zonder omwegen naar {buitenlandStad}
                  </h3>
                  <p className="text-muted-foreground">
                    Bij De {landNaam} Koerier begrijpen we dat tijd cruciaal is. Daarom bieden wij
                    directe leveringen van deur tot deur – zonder tussenstops of overladen. Uw
                    zending wordt met de hoogste prioriteit behandeld en rechtstreeks van {nlPlaats}
                    naar {buitenlandStad} vervoerd. Snel, veilig en betrouwbaar – precies zoals u
                    mag verwachten van een specialist in spoedtransport.
                  </p>
                </div>

                <div>
                  <h3 className="font-display text-xl font-bold mb-2">Spoedtransport 24/7</h3>
                  <p className="text-muted-foreground">
                    Voor al uw spoedtransport van {nlPlaats} naar {buitenlandStad} bent u dus bij
                    De {landNaam} Koerier aan het juiste adres. 365 dagen per jaar staat ons geheel
                    wagenpark dag en nacht voor al uw spoedtransporten klaar!
                  </p>
                </div>

                <div>
                  <h3 className="font-display text-xl font-bold mb-2">Koeriersdiensten</h3>
                  <p className="text-muted-foreground">
                    Wij bieden verschillende koeriersdiensten van {nlPlaats} naar {buitenlandStad}.
                    Een belangrijk document of pallet in onze bestelwagens en tot 8 pallets in onze
                    bakwagens met laadklep. Al onze koeriersdiensten zijn dedicated en direct
                    vervoer. Dit wil zeggen dat wij alleen met uw zending direct van A naar B
                    rijden zonder dat er zendingen van andere klanten in de wagens aanwezig zijn.
                  </p>

                </div>

                <div>
                  <h3 className="font-display text-xl font-bold mb-2">
                    Spoedkoerier met ADR boven de 1000 punten
                  </h3>
                  <p className="text-muted-foreground">
                    Ook voor uw vervoer van gevaarlijke stoffen boven de 1000 punten van {nlPlaats}
                    naar {buitenlandStad} bent u bij ons aan het juiste adres. Al onze wagens zijn
                    ADR ingericht en natuurlijk beschikken wij over de juiste papieren voor het
                    vervoer van gevaarlijke stoffen.
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <SmartCTA
                  afstandKm={km}
                  prijsVanaf={prijsBestelwagen}
                  bestemming={buitenlandStad}
                  vertrek={nlPlaats}
                  variant="compact"
                />
                <QuoteForm 
                  routeId={route.id}
                  landId={route.buitenland_stad?.land?.id}
                  defaultOphaalPlaats={nlPlaats}
                  defaultAfleverPlaats={buitenlandStad}
                />
              </div>
            </div>
          </div>
        </section>

        <RouteFAQ faq={faq} />

        <RelatedRoutes
          currentRouteId={route.id}
          nlPlaatsId={route.nl_plaats?.id || ''}
          nlPlaatsNaam={nlPlaats}
          landId={route.buitenland_stad?.land?.id || ''}
          landNaam={landNaam}
          landSlug={canonicalSlug}
        />
      </main>

      <Footer />
    </div>
  );
};

export default RouteDetailPage;