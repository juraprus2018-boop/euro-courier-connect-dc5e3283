import { HelmetProvider } from 'react-helmet-async';
import { Header } from '@/components/public/Header';
import { Footer } from '@/components/public/Footer';
import { SEOHead } from '@/components/SEOHead';
import { PageBreadcrumb } from '@/components/public/PageBreadcrumb';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Gauge, Globe2, ShieldCheck, Clock } from 'lucide-react';
import { useLand } from '@/hooks/useLand';

const TachograafPage = () => {
  const { land } = useLand();
  const landNaam = land?.naam;
  const bedrijf = landNaam ? `De ${landNaam} Koerier` : 'De Europa Koerier';

  return (
    <HelmetProvider>
      <SEOHead
        title={`Tachograaf & buitenland ritten | ${bedrijf}`}
        description={`${bedrijf} is uitgerust met een tachograaf en volledig beschikbaar voor buitenland ritten door heel Europa. Veilig, legaal en betrouwbaar transport.`}
        landNaam={landNaam}
      />
      <div className="min-h-screen flex flex-col">
        <Header landNaam={landNaam} />
        <main className="flex-1">
          <div className="container py-8">
            <PageBreadcrumb items={[{ label: 'Tachograaf & buitenland ritten' }]} />
          </div>

          <section className="container pb-12">
            <div className="max-w-3xl">
              <h1 className="font-display text-4xl md:text-5xl font-bold mb-6">
                {bedrijf} is uitgerust met tachograaf en beschikbaar voor buitenland ritten
              </h1>
              <p className="text-lg text-muted-foreground">
                {bedrijf} is uitgerust met een <strong>tachograaf</strong> en volledig beschikbaar
                voor <strong>buitenland ritten</strong>. Hierdoor kunnen wij bij {bedrijf} legaal,
                veilig en zonder onderbrekingen door heel Europa rijden, precies wat u van een
                professionele spoedkoerier mag verwachten.
              </p>
            </div>
          </section>

          <section className="container pb-16 grid gap-6 md:grid-cols-2">
            <Card className="p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary">
                  <Gauge className="h-5 w-5 text-primary-foreground" />
                </div>
                <h2 className="font-display text-2xl font-bold">Wat is een tachograaf?</h2>
              </div>
              <p className="text-muted-foreground">
                Een tachograaf is een digitaal apparaat dat rij- en rusttijden van de chauffeur
                registreert. Voor internationaal transport is dit wettelijk verplicht binnen de EU.
                Onze voertuigen zijn hiermee uitgerust, zodat wij altijd conform de Europese
                regelgeving rijden.
              </p>
            </Card>

            <Card className="p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary">
                  <Globe2 className="h-5 w-5 text-primary-foreground" />
                </div>
                <h2 className="font-display text-2xl font-bold">Buitenland ritten</h2>
              </div>
              <p className="text-muted-foreground">
                Wij zijn dagelijks beschikbaar voor spoedritten naar het buitenland. Of het nu gaat
                om een rit naar Duitsland, Frankrijk, Italië, Kroatië of elk ander Europees land —
                wij staan voor u klaar.
              </p>
            </Card>

            <Card className="p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary">
                  <ShieldCheck className="h-5 w-5 text-primary-foreground" />
                </div>
                <h2 className="font-display text-2xl font-bold">Legaal & veilig</h2>
              </div>
              <p className="text-muted-foreground">
                Dankzij de tachograaf voldoen wij aan alle Europese rij- en rusttijdenwetgeving.
                Dit betekent geen boetes, geen vertragingen en maximale veiligheid voor uw
                zending.
              </p>
            </Card>

            <Card className="p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary">
                  <Clock className="h-5 w-5 text-primary-foreground" />
                </div>
                <h2 className="font-display text-2xl font-bold">24/7 inzetbaar</h2>
              </div>
              <p className="text-muted-foreground">
                Onze chauffeurs zijn getraind en beschikbaar voor lange internationale ritten. Wij
                plannen slim zodat uw zending altijd op tijd op de eindbestemming aankomt.
              </p>
            </Card>
          </section>

          <section className="container pb-20">
            <Card className="p-8 md:p-12 text-center bg-gradient-primary text-primary-foreground">
              <h2 className="font-display text-3xl font-bold mb-4">Buitenland rit nodig?</h2>
              <p className="mb-6 max-w-2xl mx-auto opacity-90">
                Vraag direct een offerte aan of neem contact met ons op. Wij rijden vandaag nog voor u.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Button asChild size="lg" variant="secondary">
                  <Link to="/offerte">Offerte aanvragen</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="bg-transparent text-white border-white hover:bg-white/10">
                  <Link to="/contact">Neem contact op</Link>
                </Button>
              </div>
            </Card>
          </section>
        </main>
        <Footer />
      </div>
    </HelmetProvider>
  );
};

export default TachograafPage;
