import { Header } from '@/components/public/Header';
import { Footer } from '@/components/public/Footer';
import { PageBreadcrumb } from '@/components/public/PageBreadcrumb';
import { PriceCalculator } from '@/components/public/PriceCalculator';
import { SEOHead } from '@/components/SEOHead';

const PrijsIndicatiePage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead pageKey="prijs_berekenen" />
      <Header />

      <main className="flex-1">
        <section className="bg-gradient-dark text-primary-foreground py-12 lg:py-16">
          <div className="container">
            <PageBreadcrumb
              items={[{ label: 'Prijs berekenen' }]}
              className="mb-6 text-primary-foreground/70"
            />
            <h1 className="font-display text-3xl md:text-5xl font-bold leading-tight">
              Spoedkoerier prijs berekenen
            </h1>
            <p className="mt-4 text-primary-foreground/80 text-lg max-w-2xl">
              Vul ophaal- en afleveradres in en ontvang direct een prijsindicatie
              voor je spoedtransport door heel Europa.
            </p>
          </div>
        </section>

        <section className="py-12 lg:py-16 bg-muted/30">
          <div className="container">
            <PriceCalculator />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default PrijsIndicatiePage;
