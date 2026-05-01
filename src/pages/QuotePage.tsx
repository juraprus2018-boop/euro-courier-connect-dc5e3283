import { useSearchParams } from 'react-router-dom';
import { Header } from '@/components/public/Header';
import { Footer } from '@/components/public/Footer';
import { QuoteForm } from '@/components/public/QuoteForm';
import { PageBreadcrumb } from '@/components/public/PageBreadcrumb';
import { EuropaRouteMap } from '@/components/public/EuropaRouteMap';

const QuotePage = () => {
  const [searchParams] = useSearchParams();
  const van = searchParams.get('van') || undefined;
  const naar = searchParams.get('naar') || undefined;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-12">
        <div className="container max-w-7xl">
          <PageBreadcrumb items={[{ label: 'Offerte aanvragen' }]} className="mb-6" />
          <div className="mb-8">
            <h1 className="font-display text-3xl md:text-4xl font-bold">Offerte spoedkoerier aanvragen</h1>
            <p className="mt-2 text-muted-foreground">
              Vul het formulier in en ontvang binnen 1 uur een vrijblijvende offerte.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
            <div className="lg:col-span-3">
              <QuoteForm defaultOphaalPlaats={van} defaultAfleverPlaats={naar} />
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
