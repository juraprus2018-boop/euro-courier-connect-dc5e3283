import { useSearchParams } from 'react-router-dom';
import { Mail, MapPin, Phone, Plane, Ship, Train } from 'lucide-react';
import { Header } from '@/components/public/Header';
import { Footer } from '@/components/public/Footer';
import { PrijsBerekenenForm } from '@/components/public/PrijsBerekenenForm';
import { PageBreadcrumb } from '@/components/public/PageBreadcrumb';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SEOHead } from '@/components/SEOHead';
import { CONTACT } from '@/lib/contact';
import { useLand } from '@/hooks/useLand';

const PrijsBerekenenPage = () => {
  const [searchParams] = useSearchParams();
  const { land } = useLand();
  const landNaam = land?.naam;
  const van = searchParams.get('van') || undefined;
  const naar = searchParams.get('naar') || undefined;

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead pageKey="prijs_berekenen" landNaam={landNaam} />
      <Header landNaam={landNaam} />

      <main className="flex-1">
        <section className="bg-gradient-dark text-primary-foreground py-16 lg:py-20">
          <div className="container">
            <PageBreadcrumb
              items={[{ label: 'Prijs berekenen' }]}
              className="mb-6 text-primary-foreground/70"
            />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              <div className="lg:col-span-2">
                <h1 className="font-display text-3xl md:text-5xl font-bold leading-tight">
                  Bereken je spoedkoerier transportkosten
                </h1>
                <p className="mt-5 text-primary-foreground/80 text-lg max-w-2xl">
                  Bij {CONTACT.bedrijf} regel je eenvoudig spoedtransport door heel
                  Europa. Vul je transportgegevens in en ontvang direct een
                  prijsindicatie. Wij nemen daarna persoonlijk contact met je op om
                  je zending te bevestigen.
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Button size="lg" asChild className="bg-cta text-cta-foreground hover:bg-cta/90">
                    <a href="#bereken">Bereken transportkosten</a>
                  </Button>
                  <Button size="lg" variant="outline-light" asChild>
                    <a href={CONTACT.telefoonHref}>
                      <Phone className="mr-2 h-4 w-4" /> {CONTACT.telefoon}
                    </a>
                  </Button>
                </div>
              </div>

              <Card className="bg-background/95 text-foreground border-0 shadow-xl">
                <CardContent className="p-6">
                  <p className="text-sm font-semibold text-accent uppercase tracking-wider">
                    Hulp nodig?
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Neem direct contact op met onze specialist.
                  </p>
                  <div className="mt-4 flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="font-display text-2xl font-bold text-primary">
                        DK
                      </span>
                    </div>
                    <div>
                      <p className="font-display font-bold text-lg">
                        {CONTACT.bedrijf}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Spoedkoerier specialist
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 space-y-2">
                    <a
                      href={CONTACT.telefoonHref}
                      className="flex items-center gap-2 text-sm font-medium hover:text-primary"
                    >
                      <Phone className="h-4 w-4 text-primary" />
                      {CONTACT.telefoonInternational}
                    </a>
                    <a
                      href={CONTACT.emailHref}
                      className="flex items-center gap-2 text-sm font-medium hover:text-primary"
                    >
                      <Mail className="h-4 w-4 text-primary" />
                      {CONTACT.email}
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section id="bereken" className="py-16 bg-muted/30">
          <div className="container">
            <div className="text-center mb-10">
              <span className="text-accent font-semibold uppercase tracking-wider text-sm">
                Prijs berekenen
              </span>
              <h2 className="font-display text-3xl md:text-4xl font-bold mt-2">
                Bereken je transportkosten
              </h2>
              <p className="mt-3 text-muted-foreground">
                Vraag een vrijblijvende offerte aan, binnen 1 uur reactie.
              </p>
            </div>
            <PrijsBerekenenForm defaultOphaalPlaats={van} defaultAfleverPlaats={naar} />
          </div>
        </section>

        <section className="py-16">
          <div className="container">
            <div className="text-center mb-10">
              <h2 className="font-display text-3xl md:text-4xl font-bold">
                Offerte voor zee-, lucht- en railtransport
              </h2>
              <p className="mt-3 text-muted-foreground max-w-3xl mx-auto">
                Voor lucht-, zee- of railtransport stellen wij altijd een offerte
                op maat. Onze specialisten bekijken de beste route en transittijd
                voor jouw zending.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: Plane,
                  title: 'Offerte luchtvracht',
                  desc: 'Internationale zendingen via de lucht. Wij bekijken route, capaciteit en planning en stellen een passende offerte op.',
                },
                {
                  icon: Ship,
                  title: 'Offerte zeevracht',
                  desc: 'Containertransport of grotere zendingen. Wij bekijken de beschikbare afvaarten en maken een offerte op maat.',
                },
                {
                  icon: Train,
                  title: 'Offerte railtransport',
                  desc: 'Internationale zendingen via het spoor. Onze specialisten adviseren over de mogelijkheden en stellen een offerte op.',
                },
              ].map((s) => (
                <Card
                  key={s.title}
                  className="border-2 hover:border-primary/40 hover:shadow-lg transition-all"
                >
                  <CardContent className="p-6">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <s.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-display text-xl font-bold">{s.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
                    <Button
                      asChild
                      variant="link"
                      className="px-0 mt-3 text-primary"
                    >
                      <a href={CONTACT.emailHref}>Vraag offerte aan →</a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 bg-muted/30">
          <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h2 className="font-display text-2xl md:text-3xl font-bold">
                  Contact en adresgegevens
                </h2>
                <p className="mt-3 text-muted-foreground">
                  Heb je vragen over je zending of wil je sparren met onze
                  specialist? We staan voor je klaar.
                </p>
                <div className="mt-6 space-y-3 text-sm">
                  <p className="font-semibold">{CONTACT.bedrijf}</p>
                  <p className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5 text-primary" />
                    {CONTACT.adres}, {CONTACT.postcode} {CONTACT.plaats}, Nederland
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" />
                    <a href={CONTACT.telefoonHref} className="hover:text-primary">
                      {CONTACT.telefoonInternational}
                    </a>
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" />
                    <a href={CONTACT.emailHref} className="hover:text-primary">
                      {CONTACT.email}
                    </a>
                  </p>
                  <p className="text-muted-foreground pt-2">
                    KvK {CONTACT.kvk} · BTW {CONTACT.btw}
                  </p>
                </div>
              </div>
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm font-semibold text-accent uppercase tracking-wider">
                    Hulp nodig?
                  </p>
                  <p className="mt-2 font-display text-xl font-bold">
                    Bel met onze spoedkoerier
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Direct contact met een specialist die je zending door heel
                    Europa regelt.
                  </p>
                  <Button asChild size="lg" className="mt-4 w-full">
                    <a href={CONTACT.telefoonHref}>
                      <Phone className="mr-2 h-4 w-4" />
                      {CONTACT.telefoonInternational}
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default PrijsBerekenenPage;