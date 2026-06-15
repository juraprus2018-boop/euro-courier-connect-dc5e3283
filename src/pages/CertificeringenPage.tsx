import { HelmetProvider } from 'react-helmet-async';
import { Header } from '@/components/public/Header';
import { Footer } from '@/components/public/Footer';
import { SEOHead } from '@/components/SEOHead';
import { PageBreadcrumb } from '@/components/public/PageBreadcrumb';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { ShieldCheck, AlertTriangle } from 'lucide-react';
import niwoLogo from '@/assets/niwo-eurovergunning.png';

const CertificeringenPage = () => (
  <HelmetProvider>
    <SEOHead pageKey="certificeringen" />
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="container py-8">
          <PageBreadcrumb items={[{ label: 'Certificeringen' }]} />
        </div>

        <section className="container pb-12">
          <div className="max-w-3xl">
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-6">Certificeringen</h1>
            <p className="text-lg text-muted-foreground">
              Bij De Europa Koerier hechten wij veel waarde aan kwaliteit en betrouwbaarheid.
              Daarom werken wij volgens erkende standaarden en beschikken wij over de juiste
              vergunningen en certificeringen voor transport door heel Europa.
            </p>
          </div>
        </section>

        <section className="container space-y-8 pb-16">
          <Card className="overflow-hidden">
            <div className="grid md:grid-cols-3 gap-0">
              <div className="bg-muted flex items-center justify-center p-8">
                <img
                  src={niwoLogo}
                  alt="NIWO Eurovergunning logo"
                  loading="lazy"
                  className="max-h-40 w-auto object-contain"
                />
              </div>
              <div className="p-8 md:col-span-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary">
                    <ShieldCheck className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <h2 className="font-display text-2xl font-bold">NIWO Eurovergunning</h2>
                </div>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    Bij De Europa Koerier hechten wij veel waarde aan kwaliteit en betrouwbaarheid
                    in onze dienstverlening. Daarom zijn wij trots om te kunnen zeggen dat wij
                    NIWO-gecertificeerd zijn. Dit houdt in dat wij voldoen aan de hoogste normen
                    op het gebied van transport en logistiek, en dat wij ons altijd houden aan de
                    wet- en regelgeving die geldt voor ons vakgebied.
                  </p>
                  <p>
                    Als NIWO-gecertificeerd bedrijf zijn wij volledig bevoegd om goederen te
                    vervoeren door heel Europa. Wij beschikken over de benodigde vergunningen en
                    verzekeringen om uw zendingen veilig en snel op de plaats van bestemming te
                    krijgen. En omdat wij ons continu blijven ontwikkelen en verbeteren, kunt u
                    erop vertrouwen dat u altijd de beste service krijgt bij De Europa Koerier.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary">
                <AlertTriangle className="h-5 w-5 text-primary-foreground" />
              </div>
              <h2 className="font-display text-2xl font-bold">ADR vervoer gevaarlijke stoffen</h2>
            </div>
            <div className="space-y-4 text-muted-foreground">
              <p>
                Ook voor al uw ADR gevaarlijke stoffen vervoer boven de 1000 punten bent u bij
                De Europa Koerier aan het juiste adres, zoals bijvoorbeeld chemicaliën en
                brandbare materialen. Daarom zijn meerdere van onze chauffeurs ADR-gecertificeerd.
                Dit houdt in dat zij de benodigde kennis en vaardigheden hebben om deze goederen
                veilig en volgens de geldende regelgeving te vervoeren.
              </p>
              <p>
                Onze ADR-gecertificeerde chauffeurs zijn getraind om risico's te herkennen en
                hierop te anticiperen. Zij weten hoe zij moeten omgaan met onverwachte situaties
                en zijn in staat om snel en adequaat te handelen in geval van calamiteiten.
                Hierdoor kunt u erop vertrouwen dat uw zendingen altijd in goede handen zijn bij
                De Europa Koerier, ongeacht het type en de aard van de goederen die wij vervoeren.
              </p>
              <p className="font-semibold text-foreground">
                Al onze voertuigen zijn ingericht voor het vervoer van ADR gevaarlijke stoffen.
              </p>
            </div>
          </Card>
        </section>

        <section className="container pb-20">
          <Card className="p-8 md:p-12 text-center bg-gradient-primary text-primary-foreground">
            <h2 className="font-display text-3xl font-bold mb-4">Een offerte aanvragen?</h2>
            <p className="mb-6 max-w-2xl mx-auto opacity-90">
              Vraag direct een offerte aan of neem contact op voor meer informatie over onze
              certificeringen en vervoersmogelijkheden.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button asChild size="lg" variant="secondary">
                <Link to="/offerte">Offerte aanvragen</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-transparent">
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

export default CertificeringenPage;
