import { useSearchParams } from 'react-router-dom';
import { Header } from '@/components/public/Header';
import { Footer } from '@/components/public/Footer';
import { QuoteForm } from '@/components/public/QuoteForm';
import { PageBreadcrumb } from '@/components/public/PageBreadcrumb';
import { EuropaRouteMap } from '@/components/public/EuropaRouteMap';
import { SEOHead } from '@/components/SEOHead';

const QuotePage = () => {
  const [searchParams] = useSearchParams();
  const van = searchParams.get('van') || undefined;
  const naar = searchParams.get('naar') || undefined;
  const afstandStr = searchParams.get('afstand');
  const afstandKm = afstandStr ? Number(afstandStr) : undefined;
  const urgentieLabel = searchParams.get('urgentie_label') || undefined;

  // Bouw een prefilled omschrijving als context bekend is
  const omschrijving = van && naar
    ? `Spoedrit van ${van} naar ${naar}${urgentieLabel ? ` (${urgentieLabel.toLowerCase()})` : ''}`
    : undefined;

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead pageKey="quote" />
      <Header />

      <main className="flex-1 py-12">
        <div className="container">
          <PageBreadcrumb items={[{ label: 'Offerte aanvragen' }]} className="mb-6" />
          <div className="mb-8">
            <h1 className="font-display text-3xl md:text-4xl font-bold">Offerte spoedkoerier aanvragen</h1>
            <p className="mt-2 text-muted-foreground">
              {urgentieLabel
                ? `Uw selectie is overgenomen — controleer en verstuur. Wij reageren binnen 1 uur.`
                : `Vul het formulier in en ontvang binnen 1 uur een vrijblijvende offerte.`}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
            <div className="lg:col-span-3">
              <QuoteForm
                defaultOphaalPlaats={van}
                defaultAfleverPlaats={naar}
                defaultOmschrijving={omschrijving}
                urgentieLabel={urgentieLabel}
                afstandKm={afstandKm}
              />
            </div>
            <aside className="lg:col-span-2 lg:sticky lg:top-24">
              <div className="aspect-[4/5] w-full">
                <EuropaRouteMap />
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default QuotePage;
