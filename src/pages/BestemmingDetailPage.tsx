import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLand } from '@/hooks/useLand';
import { Header } from '@/components/public/Header';
import { Footer } from '@/components/public/Footer';
import { PageBreadcrumb } from '@/components/public/PageBreadcrumb';
import { SEOHead } from '@/components/SEOHead';
import { PrijsBerekenenForm } from '@/components/public/PrijsBerekenenForm';
import {
  Loader2,
  MapPin,
  ArrowRight,
  Truck,
  Phone,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Calculator,
  Package,
  Mail,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CONTACT } from '@/lib/contact';

const BestemmingDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { land, loading: landLoading } = useLand();

  const { data: stad, isLoading: stadLoading } = useQuery({
    queryKey: ['bestemming', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('buitenland_steden')
        .select(`*, land:landen(*)`)
        .eq('slug', slug)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  const { data: routes, isLoading: routesLoading } = useQuery({
    queryKey: ['routes-naar', stad?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routes')
        .select(`*, nl_plaats:nl_plaatsen(*)`)
        .eq('buitenland_stad_id', stad!.id)
        .order('afstand_km');
      if (error) throw error;
      return data;
    },
    enabled: !!stad?.id,
  });

  if (landLoading || stadLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const wrongLand = land && stad && stad.land_id !== land.id;

  if (!stad || wrongLand) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header landNaam={land?.naam} />
        <main className="flex-1 py-12">
          <div className="container text-center">
            <h1 className="font-display text-2xl font-bold mb-4">Bestemming niet gevonden</h1>
            <Link to="/bestemmingen" className="text-primary hover:underline">
              Terug naar bestemmingen
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const landNaam = stad.land?.naam || land?.naam || '';
  const stadNaam = stad.naam;

  const usps = [
    { icon: Clock, title: 'Binnen 60 minuten ophalen', desc: 'Wij komen direct bij u laden, dag en nacht.' },
    { icon: Truck, title: 'Directe rit naar ' + stadNaam, desc: 'Geen overslag, één chauffeur van deur tot deur.' },
    { icon: ShieldCheck, title: 'Volledig verzekerd', desc: 'CMR-verzekering en track & trace inbegrepen.' },
    { icon: Phone, title: '24/7 bereikbaar', desc: 'Onze planning staat dag en nacht voor u klaar.' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        pageKey="bestemming_detail"
        landNaam={landNaam || undefined}
        variables={{ stad: stadNaam, land: landNaam }}
      />
      <Header landNaam={land?.naam} />

      <main className="flex-1">
        {/* HERO */}
        <section className="bg-gradient-dark text-primary-foreground py-12 lg:py-16">
          <div className="container">
            <PageBreadcrumb
              items={[
                { label: 'Bestemmingen', to: '/bestemmingen' },
                { label: stadNaam },
              ]}
              className="mb-6 text-primary-foreground/70"
            />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              <div className="lg:col-span-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-cta/15 px-4 py-1.5 text-sm font-semibold text-cta mb-4">
                  <MapPin className="h-4 w-4" /> Spoedkoerier naar {stadNaam}
                </div>
                <h1 className="font-display text-3xl md:text-5xl font-bold leading-tight">
                  Spoedkoerier naar {stadNaam}{landNaam ? `, ${landNaam}` : ''}
                </h1>
                <p className="mt-5 text-primary-foreground/80 text-lg max-w-2xl">
                  Direct transport vanuit heel Nederland naar {stadNaam}. Eén vaste chauffeur,
                  geen overslag, 24/7 onderweg. Bereken hieronder direct uw prijs en
                  vraag in 1 minuut uw offerte aan.
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Button size="lg" asChild className="bg-cta text-cta-foreground hover:bg-cta/90">
                    <a href="#bereken">
                      <Calculator className="mr-2 h-5 w-5" /> Bereken direct uw prijs
                    </a>
                  </Button>
                  <Button size="lg" variant="outline-light" asChild>
                    <a href={CONTACT.telefoonHref}>
                      <Phone className="mr-2 h-4 w-4" /> Bel {CONTACT.telefoon}
                    </a>
                  </Button>
                </div>
                <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-primary-foreground/80">
                  <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-cta" /> 24/7 spoedservice</span>
                  <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-cta" /> Binnen 60 min ophalen</span>
                  <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-cta" /> Vaste chauffeur</span>
                  <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-cta" /> CMR verzekerd</span>
                </div>
              </div>

              <Card className="bg-background/95 text-foreground border-0 shadow-xl">
                <CardContent className="p-6">
                  <p className="text-sm font-semibold text-accent uppercase tracking-wider">
                    Direct contact
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Liever direct iemand spreken over uw rit naar {stadNaam}?
                  </p>
                  <div className="mt-5 space-y-3">
                    <a
                      href={CONTACT.telefoonHref}
                      className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors"
                    >
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Phone className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{CONTACT.telefoonInternational}</p>
                        <p className="text-xs text-muted-foreground">24/7 bereikbaar</p>
                      </div>
                    </a>
                    <a
                      href={CONTACT.emailHref}
                      className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors"
                    >
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{CONTACT.email}</p>
                        <p className="text-xs text-muted-foreground">Reactie binnen 15 min</p>
                      </div>
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* USP BAR */}
        <section className="bg-background border-b border-border py-8">
          <div className="container">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {usps.map((u) => (
                <div key={u.title} className="flex items-start gap-3">
                  <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <u.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-base">{u.title}</p>
                    <p className="text-sm text-muted-foreground">{u.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PRICE CALCULATOR */}
        <section id="bereken" className="py-14 bg-muted/30">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center mb-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-cta/15 px-4 py-1.5 text-sm font-semibold text-cta mb-3">
                <Calculator className="h-4 w-4" /> Direct uw prijs berekenen
              </div>
              <h2 className="font-display text-3xl md:text-4xl font-bold">
                Bereken direct uw spoedtransport naar {stadNaam}
              </h2>
              <p className="mt-3 text-muted-foreground text-lg">
                Vul uw laadadres en gegevens in, ontvang direct een prijsindicatie en
                bevestig uw rit naar {stadNaam} in één keer.
              </p>
            </div>
            <PrijsBerekenenForm
              defaultAfleverPlaats={`${stadNaam}${landNaam ? ', ' + landNaam : ''}`}
            />
          </div>
        </section>

        {/* INHOUDELIJKE SEO BLOK */}
        <section className="py-14 bg-background">
          <div className="container">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2 space-y-6">
                <h2 className="font-display text-2xl md:text-3xl font-bold">
                  Spoedkoerier van Nederland naar {stadNaam}
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {CONTACT.bedrijf} verzorgt dagelijks spoedtransport vanuit heel Nederland
                  naar {stadNaam}{landNaam ? ` in ${landNaam}` : ''}. Of het nu gaat om een
                  enkel pakket, een pallet of een volledige bestelbus vol lading &mdash; wij
                  rijden direct, zonder overslag en zonder tussenstops. Eén vaste chauffeur
                  haalt uw zending op en levert deze rechtstreeks af op het opgegeven adres
                  in {stadNaam}.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Heeft u een spoedlevering naar {stadNaam}? Onze planning is 24/7 bereikbaar
                  en kan binnen 60 minuten een koerier bij u op locatie hebben. Wij rijden
                  zowel overdag als &apos;s nachts en in het weekend &mdash; voor u maakt het niet
                  uit wanneer uw zending naar {stadNaam} moet vertrekken.
                </p>

                <h3 className="font-display text-xl font-semibold pt-2">
                  Wat wij vervoeren naar {stadNaam}
                </h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    'Documenten & monsters',
                    'Pakketten & dozen',
                    'Europallets (120 x 80)',
                    'Blokpallets (120 x 100)',
                    'Machineonderdelen',
                    'Medische zendingen',
                    'Auto-onderdelen',
                    'Bestelbusladingen',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <h3 className="font-display text-xl font-semibold pt-2">
                  Waarom kiezen voor een spoedkoerier naar {stadNaam}?
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Reguliere transporteurs werken met verzamelritten en overslag. Daardoor
                  duurt een levering naar {stadNaam} al snel meerdere dagen. Met een
                  spoedkoerier van {CONTACT.bedrijf} kiest u voor de snelste route: direct
                  rijden, zonder omwegen. Zo bent u verzekerd van een korte transittijd,
                  realtime track &amp; trace en een vaste contactpersoon van begin tot eind.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Onze chauffeurs kennen de routes naar {stadNaam} en {landNaam} als geen
                  ander. Wij rijden alle dagen van de week en houden rekening met
                  rijtijden, douaneprocedures en lokale aanleveradressen. U ontvangt
                  vooraf een vaste prijs &mdash; geen verrassingen achteraf.
                </p>
              </div>

              <aside className="space-y-4">
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="p-6">
                    <Package className="h-8 w-8 text-primary mb-3" />
                    <h3 className="font-display text-lg font-bold mb-2">
                      Direct offerte voor {stadNaam}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Binnen 15 minuten een persoonlijke offerte op maat in uw mailbox.
                    </p>
                    <Button asChild className="w-full bg-cta text-cta-foreground hover:bg-cta/90">
                      <a href="#bereken">
                        <Calculator className="mr-2 h-4 w-4" /> Bereken &amp; vraag aan
                      </a>
                    </Button>
                    <Button asChild variant="outline" className="w-full mt-2">
                      <a href={CONTACT.telefoonHref}>
                        <Phone className="mr-2 h-4 w-4" /> {CONTACT.telefoon}
                      </a>
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-display text-lg font-bold mb-3">
                      Veelgestelde vragen
                    </h3>
                    <dl className="space-y-3 text-sm">
                      <div>
                        <dt className="font-semibold">Hoe snel rijdt u naar {stadNaam}?</dt>
                        <dd className="text-muted-foreground">Binnen 60 minuten ophalen, direct doorrijden.</dd>
                      </div>
                      <div>
                        <dt className="font-semibold">Is mijn zending verzekerd?</dt>
                        <dd className="text-muted-foreground">Ja, standaard CMR-verzekerd.</dd>
                      </div>
                      <div>
                        <dt className="font-semibold">Kan ik &apos;s nachts laten ophalen?</dt>
                        <dd className="text-muted-foreground">Ja, wij rijden 24/7, ook in het weekend.</dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>
              </aside>
            </div>
          </div>
        </section>

        {/* ROUTES LIST */}
        <section className="py-14 bg-muted/30">
          <div className="container">
            <div className="mb-8">
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">
                Vertrekplaatsen in Nederland naar {stadNaam}
              </h2>
              <p className="text-muted-foreground">
                Wij rijden vanuit elke Nederlandse plaats naar {stadNaam}. Bekijk hieronder
                de meest gevraagde routes &mdash; uw vertrekplaats staat er niet bij?
                Vraag dan direct een offerte op maat aan.
              </p>
            </div>

            {routesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !routes || routes.length === 0 ? (
              <div className="text-center py-12 bg-background rounded-xl border border-border">
                <p className="text-muted-foreground mb-4">
                  Routes naar {stadNaam} worden geladen. Vraag direct een offerte aan.
                </p>
                <Button asChild className="bg-cta text-cta-foreground hover:bg-cta/90">
                  <a href="#bereken">Bereken uw prijs</a>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {routes.map((route) => (
                  <Link
                    key={route.id}
                    to={`/spoed-koerier-${stad.land?.slug}/${route.slug}`}
                    className="group flex items-center justify-between p-4 rounded-xl border border-border bg-background hover:border-primary hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold group-hover:text-primary transition-colors">
                          {route.nl_plaats?.naam} &rarr; {stadNaam}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {route.afstand_km} km
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-14 bg-gradient-dark text-primary-foreground">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="font-display text-2xl md:text-4xl font-bold mb-4">
                Klaar om uw zending naar {stadNaam} te versturen?
              </h2>
              <p className="text-primary-foreground/80 text-lg mb-6">
                Bereken direct uw prijs of bel onze planning &mdash; binnen 60 minuten
                staat onze koerier bij u op locatie.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Button size="lg" asChild className="bg-cta text-cta-foreground hover:bg-cta/90">
                  <a href="#bereken">
                    <Calculator className="mr-2 h-5 w-5" /> Bereken &amp; vraag offerte aan
                  </a>
                </Button>
                <Button size="lg" variant="outline-light" asChild>
                  <a href={CONTACT.telefoonHref}>
                    <Phone className="mr-2 h-4 w-4" /> {CONTACT.telefoon}
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default BestemmingDetailPage;
