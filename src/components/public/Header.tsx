import { Link } from 'react-router-dom';
import { Truck, Phone, Menu, X, ArrowRight, User, MapPin, Home, Calculator, Mail, Briefcase } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { CONTACT } from '@/lib/contact';
import { supabase } from '@/integrations/supabase/client';

const services = [
  { label: 'Internationaal transport', to: '/internationaal-transport' },
  { label: 'Kunsttransport', to: '/kunsttransport' },
  { label: 'Medisch transport', to: '/medisch-transport' },
  { label: 'On-Board Koeriersdienst', to: '/on-board-koeriersdienst' },
];

const quickLinks = [
  { label: 'Home', to: '/', icon: Home },
  { label: 'Prijs berekenen', to: '/prijs-berekenen', icon: Calculator },
  { label: 'Contact', to: '/contact', icon: Mail },
  { label: 'Mijn Account', to: '/account', icon: User },
];

interface HeaderProps {
  landNaam?: string;
}

export function Header({ landNaam }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [landen, setLanden] = useState<Array<{ naam: string; slug: string }>>([]);

  useEffect(() => {
    supabase
      .from('landen')
      .select('naam, slug')
      .eq('actief', true)
      .order('naam')
      .then(({ data }) => {
        if (data) setLanden(data);
      });
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const close = () => setMenuOpen(false);
  const siteNaam = landNaam ? `De ${landNaam} Koerier` : 'De Europa Koerier';

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-gradient-hero text-primary-foreground">
        <div className="container flex h-20 items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-foreground/15 backdrop-blur">
              <Truck className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="flex flex-col leading-tight text-primary-foreground">
              <span className="font-display text-sm sm:text-base lg:text-lg font-bold text-primary-foreground">
                {siteNaam}
              </span>
              <span className="block text-[10px] sm:text-[11px] font-medium text-primary-foreground/80 uppercase tracking-wide">
                {landNaam ? `Spoedkoerier naar ${landNaam}` : 'Spoedkoerier door heel Europa'}
              </span>
            </div>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href={CONTACT.telefoonHref}
              className="hidden sm:inline-flex items-center gap-2 rounded-full bg-primary-foreground text-primary px-4 py-2.5 text-sm font-semibold shadow-md hover:shadow-lg transition-all"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
                <Phone className="h-3.5 w-3.5" />
              </span>
              Bel: {CONTACT.telefoon}
            </a>
            <Button
              asChild
              className="hidden sm:inline-flex rounded-full bg-gradient-cta text-cta-foreground hover:brightness-110 shadow-cta animate-cta-pulse px-5"
            >
              <Link to="/offerte">
                Offerte <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>

            <button
              className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 backdrop-blur px-3 sm:px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={menuOpen}
            >
              <Menu className="h-5 w-5" />
              <span className="hidden sm:inline">Menu</span>
            </button>
          </div>
        </div>
      </header>

      {/* Fullscreen Mega Menu */}
      <div
        className={`fixed inset-0 z-[100] transition-all duration-300 ${
          menuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        aria-hidden={!menuOpen}
      >
        {/* Backdrop — solid very dark navy */}
        <div
          className="absolute inset-0 bg-[#020b1f]"
          onClick={close}
        />

        {/* Decorative gradient blobs */}
        <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-cta/15 blur-3xl" />

        {/* Content */}
        <div
          className={`relative h-full w-full overflow-y-auto text-white transition-transform duration-500 ${
            menuOpen ? 'translate-y-0' : '-translate-y-4'
          }`}
        >
          {/* Top bar */}
          <div className="container flex h-20 items-center justify-between">
            <Link to="/" onClick={close} className="flex items-center gap-3 text-white">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
                <Truck className="h-6 w-6 text-white" />
              </div>
              <span className="font-display text-base sm:text-lg font-bold text-white">{siteNaam}</span>
            </Link>
            <button
              onClick={close}
              className="inline-flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/20 px-4 py-2.5 text-sm font-semibold text-white transition-colors"
              aria-label="Sluit menu"
            >
              <X className="h-5 w-5" />
              <span className="hidden sm:inline">Sluiten</span>
            </button>
          </div>

          {/* Menu grid */}
          <div className="container pb-16 pt-4 lg:pt-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">
              {/* Quick links */}
              <div className="lg:col-span-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60 mb-5">
                  Navigatie
                </p>
                <ul className="space-y-1">
                  {quickLinks.map((l) => {
                    const Icon = l.icon;
                    return (
                      <li key={l.to}>
                        <Link
                          to={l.to}
                          onClick={close}
                          className="group flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-white/10 transition-colors text-white"
                        >
                          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 group-hover:bg-white/20 transition-colors">
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="font-medium">{l.label}</span>
                          <ArrowRight className="ml-auto h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Diensten */}
              <div className="lg:col-span-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60 mb-5 flex items-center gap-2">
                  <Briefcase className="h-3.5 w-3.5" /> Diensten
                </p>
                <ul className="space-y-1">
                  {services.map((s) => (
                    <li key={s.to}>
                      <Link
                        to={s.to}
                        onClick={close}
                        className="group flex items-center justify-between rounded-xl px-3 py-3 hover:bg-white/10 transition-colors text-white"
                      >
                        <span className="font-display text-lg">{s.label}</span>
                        <ArrowRight className="h-4 w-4 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Bestemmingen */}
              <div className="lg:col-span-5">
                <div className="flex items-center justify-between mb-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60 flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5" /> Bestemmingen
                  </p>
                  <Link
                    to="/bestemmingen"
                    onClick={close}
                    className="text-xs font-semibold text-white/80 hover:text-white inline-flex items-center gap-1"
                  >
                    Bekijk alle <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
                <ul className="grid grid-cols-2 gap-2">
                  {landen.map((l) => (
                    <li key={l.slug}>
                      <Link
                        to={`/spoedkoerier-naar/${l.slug}`}
                        onClick={close}
                        className="group flex items-center gap-2 rounded-lg px-3 py-2.5 hover:bg-white/10 transition-colors text-white"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-cta group-hover:scale-150 transition-transform" />
                        <span className="text-sm font-medium">{l.naam}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Footer CTAs in menu */}
            <div className="mt-12 pt-8 border-t border-primary-foreground/15 grid gap-3 sm:grid-cols-2">
              <a
                href={CONTACT.telefoonHref}
                className="flex items-center justify-center gap-2 rounded-full bg-primary-foreground text-primary px-6 py-4 font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                <Phone className="h-4 w-4" /> Bel direct: {CONTACT.telefoon}
              </a>
              <Link
                to="/offerte"
                onClick={close}
                className="flex items-center justify-center gap-2 rounded-full bg-gradient-cta text-cta-foreground px-6 py-4 font-semibold shadow-cta hover:brightness-110 transition-all"
              >
                Offerte aanvragen <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
