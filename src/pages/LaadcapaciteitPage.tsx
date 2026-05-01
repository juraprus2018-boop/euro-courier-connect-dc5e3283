import { HelmetProvider } from 'react-helmet-async';
import { Header } from '@/components/public/Header';
import { Footer } from '@/components/public/Footer';
import { SEOHead } from '@/components/SEOHead';
import { PageBreadcrumb } from '@/components/public/PageBreadcrumb';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Truck, Package, PackageOpen } from 'lucide-react';
import citan from '@/assets/citan.webp';
import bestelbus from '@/assets/bestelbus.webp';
import bakwagen from '@/assets/bakwagen.webp';

const voertuigen = [
  {
    icon: Package,
    naam: 'Bestelwagens',
    afbeelding: citan,
    laadvermogen: '618 kg',
    afmetingen: '200 × 150 × 115 cm',
    pallets: '1 pallet (max. 115 cm hoog)',
    beschrijving:
      'Onze bestelwagens hebben een laadvermogen van maximaal 618 kg. Dit maakt ze ideaal voor het vervoeren van kleinere zendingen, zoals enveloppen, pakketten en kleine dozen. De laadruimte is 200 cm lang, 150 cm breed en 115 cm hoog. Hierdoor passen ze in smalle straatjes en komen ze op vrijwel elke locatie. Geschikt voor het vervoer van 1 pallet die niet hoger geladen is dan 115 cm.',
  },
  {
    icon: PackageOpen,
    naam: 'Bestelbussen (XL)',
    afbeelding: bestelbus,
    laadvermogen: '1.369 kg',
    afmetingen: '325 × 170 × 180 cm',
    pallets: '4 Europallets',
    beschrijving:
      'Onze bestelbussen hebben een laadvermogen tot 1.369 kg. Dit maakt ze geschikt voor grotere zendingen zoals meubels, apparatuur en machines. De laadruimte is 325 cm lang, 170 cm breed en 180 cm hoog – ruimte voor 4 Europallets en flexibel genoeg om ook op moeilijk bereikbare locaties te komen.',
  },
  {
    icon: Truck,
    naam: 'Bakwagens met laadklep',
    afbeelding: bakwagen,
    laadvermogen: '870 kg',
    afmetingen: '420 × 210 × 220 cm',
    pallets: '8 Europallets',
    beschrijving:
      'Onze bakwagens met laadklep hebben een laadvermogen tot 870 kg en zijn ideaal voor grote hoeveelheden goederen, zoals 8 Europallets en grote machines. De laadruimte is 420 cm lang, 210 cm breed en 220 cm hoog. De laadklep maakt het laden en lossen eenvoudig.',
  },
];

const LaadcapaciteitPage = () => (
  <HelmetProvider>
    <SEOHead
      title="Laadcapaciteit | De Europa Koerier"
      description="Bestelwagens, bestelbussen en bakwagens met laadklep. Bekijk de laadvermogens en afmetingen van ons wagenpark."
    />
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="container py-8">
          <PageBreadcrumb items={[{ label: 'Laadcapaciteit' }]} />
        </div>

        <section className="container pb-12">
          <div className="max-w-3xl">
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-6">Laadcapaciteit</h1>
            <p className="text-lg text-muted-foreground">
              Bij De Europa Koerier beschikken wij over een uitgebreid wagenpark van bestelwagens,
              bestelbussen en bakwagens met laadklep. Hierdoor vervoeren wij vrijwel elke soort
              zending – van kleine pakketten tot grote pallets. Hieronder vindt u meer informatie
              over de laadcapaciteit van onze voertuigen.
            </p>
          </div>
        </section>

        <section className="container space-y-12 pb-16">
          {voertuigen.map((v, i) => {
            const Icon = v.icon;
            return (
              <Card key={v.naam} className="overflow-hidden">
                <div className={`grid md:grid-cols-2 gap-0 ${i % 2 === 1 ? 'md:[&>div:first-child]:order-2' : ''}`}>
                  <div className="bg-muted flex items-center justify-center p-6">
                    <img
                      src={v.afbeelding}
                      alt={`${v.naam} van De Europa Koerier`}
                      loading="lazy"
                      className="w-full h-auto object-contain max-h-80"
                    />
                  </div>
                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary">
                        <Icon className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <h2 className="font-display text-2xl font-bold">{v.naam}</h2>
                    </div>
                    <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 text-sm">
                      <div>
                        <dt className="text-muted-foreground">Laadvermogen</dt>
                        <dd className="font-semibold">{v.laadvermogen}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Afmetingen (L×B×H)</dt>
                        <dd className="font-semibold">{v.afmetingen}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Pallets</dt>
                        <dd className="font-semibold">{v.pallets}</dd>
                      </div>
                    </dl>
                    <p className="text-muted-foreground">{v.beschrijving}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </section>

        <section className="container pb-20">
          <Card className="p-8 md:p-12 text-center bg-gradient-primary text-primary-foreground">
            <h2 className="font-display text-3xl font-bold mb-4">Vragen over de laadcapaciteit?</h2>
            <p className="mb-6 max-w-2xl mx-auto opacity-90">
              Onze voertuigen zijn goed onderhouden en uitgerust om uw zending veilig en snel op
              de bestemming te krijgen. Neem contact op of vraag direct een offerte aan.
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

export default LaadcapaciteitPage;
