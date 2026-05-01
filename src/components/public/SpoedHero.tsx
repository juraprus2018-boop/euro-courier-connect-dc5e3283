import { Link } from 'react-router-dom';
import { ArrowRight, Search, Users, Wallet, Zap } from 'lucide-react';
import { useState } from 'react';
import vanImage from '@/assets/citan.webp';

interface SpoedHeroProps {
  bedrijfsNaam: string;
  tagline?: string;
  landNaam?: string;
}

export function SpoedHero({ bedrijfsNaam, tagline, landNaam }: SpoedHeroProps) {
  const [van, setVan] = useState('');
  const [naar, setNaar] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (van) params.set('van', van);
    if (naar) params.set('naar', naar);
    window.location.href = `/offerte?${params.toString()}`;
  };

  return (
    <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
      {/* Decorative big curve */}
      <svg
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[60%] w-full text-background"
        viewBox="0 0 1440 600"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M0,600 L0,400 C300,520 700,180 1100,260 C1280,300 1380,260 1440,200 L1440,600 Z"
          fill="currentColor"
        />
      </svg>

      <div className="container relative z-10 pt-10 pb-24 lg:pt-16 lg:pb-32">
        <div className="grid lg:grid-cols-2 gap-10 items-start">
          {/* LEFT: title + booking card */}
          <div>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05]">
              Spoedkoerier {landNaam ? `naar ${landNaam}` : 'door heel Europa'}
            </h1>
            <p className="mt-4 text-lg sm:text-xl text-primary-foreground/90 leading-relaxed max-w-xl">
              Wij zijn <strong>{bedrijfsNaam}</strong> en rijden jouw zending met spoed
              direct van A naar B. Bijvoorbeeld rechtstreeks van Amsterdam naar
              {landNaam ? ` ${landNaam}` : ' Parijs'} – één chauffeur, één auto, geen overslag.
            </p>
            {tagline && (
              <p className="mt-3 font-display text-xl sm:text-2xl italic font-light text-primary-foreground/80">
                {tagline}
              </p>
            )}

            {/* Booking card */}
            <form
              onSubmit={handleSubmit}
              className="mt-8 rounded-3xl bg-card text-card-foreground shadow-2xl p-6 sm:p-8 animate-fade-in"
            >
              <p className="text-sm font-semibold text-primary mb-4">
                Waar moet jouw spoedzending heen?
              </p>

              {/* From / To */}
              <div className="grid sm:grid-cols-2 gap-3 mb-5">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground" htmlFor="van">Van</label>
                  <div className="mt-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      id="van"
                      value={van}
                      onChange={(e) => setVan(e.target.value)}
                      placeholder="Plaatsnaam, postcode of adres"
                      className="w-full rounded-xl border border-input bg-background pl-9 pr-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground" htmlFor="naar">Naar</label>
                  <div className="mt-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      id="naar"
                      value={naar}
                      onChange={(e) => setNaar(e.target.value)}
                      placeholder={landNaam ? `Plaatsnaam in ${landNaam}` : 'Plaatsnaam, postcode of adres'}
                      className="w-full rounded-xl border border-input bg-background pl-9 pr-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              {/* CTA */}
              <button
                type="submit"
                className="group relative w-full rounded-full bg-gradient-cta text-cta-foreground font-bold py-4 px-6 shadow-cta hover:brightness-110 transition-all flex items-center justify-center gap-2"
              >
                Kies wanneer, en kijk wat het kost
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
            </form>
          </div>

          {/* RIGHT: van image + USPs */}
          <div className="relative">
            <img
              src={vanImage}
              alt="Spoedkoerier bestelbus"
              className="w-full max-w-xl mx-auto drop-shadow-2xl animate-fade-in"
              width={1024}
              height={1024}
            />

            <div className="mt-8 lg:mt-10 rounded-2xl bg-card text-card-foreground shadow-xl p-6 max-w-xl mx-auto">
              <ul className="space-y-4">
                <li className="flex gap-3">
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-soft">
                    <Users className="h-5 w-5 text-primary" />
                  </span>
                  <span className="text-sm">
                    <strong>Meer dan 250 aangesloten koeriers.</strong>
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-soft">
                    <Wallet className="h-5 w-5 text-primary" />
                  </span>
                  <span className="text-sm">
                    <strong>Boek direct voor de laagste prijs!</strong> Al vanaf €0,50 per km.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-soft">
                    <Zap className="h-5 w-5 text-primary" />
                  </span>
                  <span className="text-sm">
                    <strong>Jouw zending al binnen 60 minuten</strong> bij je opgehaald.
                  </span>
                </li>
              </ul>
              <Link
                to="/offerte"
                className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
              >
                Direct offerte aanvragen <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
