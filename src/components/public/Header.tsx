import { Link } from 'react-router-dom';
import { Truck, Phone, Mail, MapPin, Menu, X, ChevronDown, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { CONTACT } from '@/lib/contact';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const services = [
  { label: 'Internationaal transport', to: '/internationaal-transport' },
  { label: 'Kunsttransport', to: '/kunsttransport' },
  { label: 'Medisch transport', to: '/medisch-transport' },
  { label: 'On-Board Koeriersdienst', to: '/on-board-koeriersdienst' },
];

interface HeaderProps {
  landNaam?: string;
}

export function Header({ landNaam }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const siteNaam = landNaam ? `De ${landNaam} Koerier` : 'De Europa Koerier';

  return (
    <header className="sticky top-0 z-50 w-full bg-gradient-hero text-primary-foreground">
      <div className="container flex h-20 items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 shrink-0">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-foreground/15 backdrop-blur">
            <Truck className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="hidden sm:flex flex-col leading-tight">
            <span className="font-display text-base lg:text-lg font-bold">
              {siteNaam}
            </span>
            <span className="text-[11px] font-medium text-primary-foreground/80 uppercase tracking-wide">
              {landNaam ? `Spoedkoerier naar ${landNaam}` : 'Spoedkoerier door heel Europa'}
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium">
          <Link to="/" className="text-primary-foreground/90 hover:text-primary-foreground transition-colors">Home</Link>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 text-primary-foreground/90 hover:text-primary-foreground transition-colors outline-none">
              Diensten <ChevronDown className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-popover">
              {services.map((s) => (
                <DropdownMenuItem key={s.to} asChild>
                  <Link to={s.to}>{s.label}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Link to="/bestemmingen" className="text-primary-foreground/90 hover:text-primary-foreground transition-colors flex items-center gap-1">
            <MapPin className="h-4 w-4" /> Bestemmingen
          </Link>
          
          <Link to="/contact" className="text-primary-foreground/90 hover:text-primary-foreground transition-colors">Contact</Link>
        </nav>

        {/* Pill CTAs */}
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
          <a
            href={CONTACT.emailHref}
            className="hidden xl:inline-flex items-center gap-2 rounded-full bg-primary-foreground text-primary px-4 py-2.5 text-sm font-semibold shadow-md hover:shadow-lg transition-all"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-3.5 w-3.5" />
            </span>
            Mail: {CONTACT.email}
          </a>
          <Button
            asChild
            className="hidden sm:inline-flex rounded-full bg-gradient-cta text-cta-foreground hover:brightness-110 shadow-cta px-5"
          >
            <Link to="/offerte">
              Offerte <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>

          <button
            className="lg:hidden p-2 text-primary-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-primary-foreground/15 bg-primary-deep">
          <nav className="container py-4 flex flex-col gap-4 text-primary-foreground">
            <Link to="/" className="text-sm font-medium hover:opacity-80" onClick={() => setMobileMenuOpen(false)}>Home</Link>
            <div className="pt-2 border-t border-primary-foreground/15">
              <p className="text-xs font-semibold uppercase tracking-wider mb-2 opacity-70">Diensten</p>
              <div className="flex flex-col gap-2 pl-2">
                {services.map((s) => (
                  <Link key={s.to} to={s.to} className="text-sm hover:opacity-80" onClick={() => setMobileMenuOpen(false)}>
                    {s.label}
                  </Link>
                ))}
              </div>
            </div>
            <Link to="/bestemmingen" className="text-sm font-medium flex items-center gap-1 hover:opacity-80" onClick={() => setMobileMenuOpen(false)}>
              <MapPin className="h-4 w-4" /> Bestemmingen
            </Link>
            
            <Link to="/contact" className="text-sm font-medium hover:opacity-80" onClick={() => setMobileMenuOpen(false)}>Contact</Link>
            <a href={CONTACT.telefoonHref} className="inline-flex items-center gap-2 rounded-full bg-primary-foreground text-primary px-4 py-2 text-sm font-semibold w-fit">
              <Phone className="h-4 w-4" /> {CONTACT.telefoon}
            </a>
            <Button asChild className="w-full rounded-full bg-gradient-cta text-cta-foreground shadow-cta">
              <Link to="/offerte" onClick={() => setMobileMenuOpen(false)}>Offerte aanvragen</Link>
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}
