import { Zap, ArrowRight, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CONTACT } from '@/lib/contact';

interface SpoedKoerierSectionProps {
  landNaam?: string;
}

export function SpoedKoerierSection({ landNaam }: SpoedKoerierSectionProps) {
  return (
    <section className="py-16 bg-primary-soft border-y border-primary/20">
      <div className="container">
        <div className="max-w-4xl mx-auto flex flex-col lg:flex-row items-center gap-8 text-center lg:text-left">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-cta text-cta-foreground flex-shrink-0 shadow-cta">
            <Zap className="h-10 w-10" />
          </div>

          <div className="flex-1">
            <span className="inline-block text-primary font-bold uppercase tracking-widest text-sm">
              Spoedkoerier
            </span>
            <h2 className="font-display text-3xl lg:text-4xl font-bold mt-2">
              {landNaam
                ? `Spoedkoerier nodig naar ${landNaam}? Wij vertrekken vandaag nog`
                : 'Spoedkoerier nodig? Wij rijden direct van A naar B'}
            </h2>
            <p className="mt-3 text-lg text-muted-foreground">
              {landNaam
                ? `Als De ${landNaam} Koerier zijn wij gespecialiseerd in rechtstreekse ritten vanuit Nederland naar ${landNaam}. Eén chauffeur, één bestelwagen, zonder tussenstops of overslag. Onze chauffeurs kennen de routes naar ${landNaam} op hun duimpje en vertrekken vaak binnen het uur na uw boeking.`
                : `Wij zijn De Europa Koerier en vervoeren jouw spoedzending rechtstreeks, bijvoorbeeld van Amsterdam naar Parijs. Geen tussenstops, geen overslag. De chauffeur vertrekt direct na uw boeking, ook 's avonds en in het weekend.`}
            </p>
          </div>

          <div className="flex flex-col gap-3 flex-shrink-0">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90" asChild>
              <a href={CONTACT.telefoonHref}>
                <Phone className="mr-2 h-5 w-5" />
                {CONTACT.telefoon}
              </a>
            </Button>
            <Button size="lg" className="bg-gradient-cta text-cta-foreground hover:brightness-110 shadow-cta" asChild>
              <Link to="/offerte">
                Direct offerte
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
