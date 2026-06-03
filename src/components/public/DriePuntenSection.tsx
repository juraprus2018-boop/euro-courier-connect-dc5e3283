import { Truck, Wallet, Clock } from 'lucide-react';
import { useTarieven } from '@/hooks/useTarieven';

interface DriePuntenSectionProps {
  landNaam?: string;
}
export function DriePuntenSection({ landNaam }: DriePuntenSectionProps) {
  const bestemming = landNaam ? `naar ${landNaam}` : 'door heel Europa';
  const { tarieven } = useTarieven();
  const prijs = tarieven.bestelwagen.toFixed(2).replace('.', ',');
  return (
    <section className="py-20 bg-background">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Left col */}
          <div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold leading-tight">
              Jouw transport in 3 minuten geregeld
              <span className="text-cta">.</span>
            </h2>
            <p className="mt-5 text-muted-foreground leading-relaxed">
              Zonder onnodige vragen, in heel Nederland en {bestemming}, vanaf ieder adres.
              Vul jouw ophaal- en afleveradres in, kies een transportwagen en wij regelen
              direct een chauffeur voor je. Eenvoudig, snel en transparant geprijsd.
            </p>

            <ul className="mt-8 space-y-4">
              <li className="flex gap-4">
                <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-primary-soft">
                  <Truck className="h-6 w-6 text-primary" />
                </span>
                <div>
                  <h3 className="font-display font-semibold">Direct van A naar B</h3>
                  <p className="text-sm text-muted-foreground">Geen overslag, geen tussenstops. Eén chauffeur, één rit.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-primary-soft">
                  <Clock className="h-6 w-6 text-primary" />
                </span>
                <div>
                  <h3 className="font-display font-semibold">Binnen 60 minuten ophalen</h3>
                  <p className="text-sm text-muted-foreground">Bij spoed staan we klaar, ook 's avonds en in het weekend.</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Right col */}
          <div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold leading-tight">
              Stem de service af op jouw budget
              <span className="text-cta">.</span>
            </h2>
            <p className="mt-5 text-muted-foreground leading-relaxed">
              Afhankelijk van de tijdsdruk is er voor ieders budget wel een passende oplossing.
              Vergelijk eenvoudig de prijs voor verschillende transporttypes en kies wat bij
              jouw zending past.
            </p>

            <ul className="mt-8 space-y-4">
              <li className="flex gap-4">
                <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-primary-soft">
                  <Wallet className="h-6 w-6 text-primary" />
                </span>
                <div>
                  <h3 className="font-display font-semibold">Vanaf €{prijs} per kilometer</h3>
                  <p className="text-sm text-muted-foreground">Eerlijke kilometerprijs zonder verrassingen achteraf.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
