import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Phone, MessageCircle, FileText, Zap, Clock, Truck } from 'lucide-react';
import { CONTACT } from '@/lib/contact';
import { supabase } from '@/integrations/supabase/client';
import { formatPrijsRange } from '@/lib/prijs';

interface SmartCTAProps {
  /** Afstand in km (depot-loop of direct, beide werken) */
  afstandKm?: number;
  /** Geschatte rijtijd in minuten (optioneel, anders afgeleid uit km) */
  rijtijdMinuten?: number;
  /** Vanaf-prijs in EUR */
  prijsVanaf?: number;
  /** Bestemming (voor persoonlijke boodschap) */
  bestemming?: string;
  /** Vertrekpunt (optioneel) */
  vertrek?: string;
  /** Pre-fill voor offerte-link */
  offerteHref?: string;
  /** Compact (in zijbalk) of breed (na calculator) */
  variant?: 'wide' | 'compact';
}

const DEFAULT_WA = '+31407676704';

interface Tier {
  key: 'directe-rit' | 'zelfde-dag' | 'binnen-24u' | 'spoed-internationaal';
  badge: string;
  badgeColor: string;
  icon: typeof Zap;
  titel: (b?: string) => string;
  subtitel: (rijtijd: string, b?: string) => string;
  primary: 'bel' | 'whatsapp' | 'offerte';
  whatsapp: (b?: string, v?: string) => string;
}

const TIERS: Tier[] = [
  {
    key: 'directe-rit',
    badge: 'Binnen 2 uur ter plaatse',
    badgeColor: 'bg-success text-success-foreground',
    icon: Zap,
    titel: (b) => `Snelle rit naar ${b || 'uw bestemming'}, bel direct`,
    subtitel: (rt) => `Onze chauffeur kan binnen ${rt} bij u zijn. Voor spoed: bel ons direct, dat is sneller dan een formulier.`,
    primary: 'bel',
    whatsapp: (b, v) =>
      `Hallo, ik heb een spoedrit${v ? ` van ${v}` : ''}${b ? ` naar ${b}` : ''}. Kunnen jullie vandaag rijden?`,
  },
  {
    key: 'zelfde-dag',
    badge: 'Zelfde dag mogelijk',
    badgeColor: 'bg-warning text-warning-foreground',
    icon: Clock,
    titel: (b) => `Zelfde dag levering naar ${b || 'uw bestemming'} mogelijk`,
    subtitel: (rt) => `Met ${rt} rijtijd kunnen wij uw zending vandaag nog leveren. Bel of WhatsApp voor directe inzet.`,
    primary: 'whatsapp',
    whatsapp: (b, v) =>
      `Hallo, ik wil graag vandaag een koerier${v ? ` van ${v}` : ''}${b ? ` naar ${b}` : ''}. Wat is de eerstvolgende mogelijkheid?`,
  },
  {
    key: 'binnen-24u',
    badge: 'Levering binnen 24 uur',
    badgeColor: 'bg-primary text-primary-foreground',
    icon: Truck,
    titel: (b) => `Spoedkoerier naar ${b || 'uw bestemming'} binnen 24 uur`,
    subtitel: (rt) => `Rijtijd circa ${rt}. Vraag direct een offerte aan en uw zending vertrekt vandaag of morgenvroeg.`,
    primary: 'offerte',
    whatsapp: (b, v) =>
      `Hallo, ik wil een offerte voor een rit${v ? ` van ${v}` : ''}${b ? ` naar ${b}` : ''} binnen 24 uur.`,
  },
  {
    key: 'spoed-internationaal',
    badge: '1 chauffeur · non-stop',
    badgeColor: 'bg-primary text-primary-foreground',
    icon: Truck,
    titel: (b) => `Direct internationaal transport naar ${b || 'uw bestemming'}`,
    subtitel: (rt) => `Rijtijd circa ${rt} met één chauffeur, geen overlading. Vraag een offerte voor de exacte prijs en vertrektijd.`,
    primary: 'offerte',
    whatsapp: (b, v) =>
      `Hallo, ik wil graag een offerte voor internationaal spoedtransport${v ? ` van ${v}` : ''}${b ? ` naar ${b}` : ''}.`,
  },
];

function pickTier(km?: number, minuten?: number): Tier {
  const k = Number(km) || 0;
  const eff = minuten ?? (k > 0 ? (k / 90) * 60 : 0); // ~90 km/h gemiddeld
  if (eff > 0 && eff <= 120) return TIERS[0]; // ≤ 2u
  if (eff > 120 && eff <= 360) return TIERS[1]; // 2–6u → zelfde dag
  if (k <= 800) return TIERS[2]; // binnen 24u
  return TIERS[3]; // verre internationale rit
}

function fmtRijtijd(minuten: number): string {
  if (minuten < 60) return `${Math.round(minuten)} minuten`;
  const u = Math.floor(minuten / 60);
  const m = Math.round(minuten % 60);
  if (u < 10 && m > 0) return `${u}u ${m}min`;
  return `${u} uur`;
}

export function SmartCTA({
  afstandKm,
  rijtijdMinuten,
  prijsVanaf,
  bestemming,
  vertrek,
  offerteHref = '/offerte',
  variant = 'wide',
}: SmartCTAProps) {
  const [waNumber, setWaNumber] = useState(DEFAULT_WA);

  useEffect(() => {
    supabase
      .from('instellingen')
      .select('waarde')
      .eq('sleutel', 'whatsapp_nummer')
      .maybeSingle()
      .then(({ data }) => {
        if (data?.waarde) setWaNumber(data.waarde);
      });
  }, []);

  const tier = pickTier(afstandKm, rijtijdMinuten);
  const Icon = tier.icon;
  const eff = rijtijdMinuten ?? (afstandKm ? (afstandKm / 90) * 60 : 0);
  const rijtijd = eff > 0 ? fmtRijtijd(eff) : 'enkele uren';
  const titel = tier.titel(bestemming);
  const subtitel = tier.subtitel(rijtijd, bestemming);

  const waMsg = encodeURIComponent(tier.whatsapp(bestemming, vertrek));
  const waHref = `https://wa.me/${waNumber.replace(/[^0-9]/g, '')}?text=${waMsg}`;

  // Bouw offerte-link met alle context als query params
  const offerteParams = new URLSearchParams();
  if (vertrek) offerteParams.set('van', vertrek);
  if (bestemming) offerteParams.set('naar', bestemming);
  if (afstandKm) offerteParams.set('afstand', String(Math.round(afstandKm)));
  if (eff > 0) offerteParams.set('rijtijd', String(Math.round(eff)));
  if (prijsVanaf) offerteParams.set('prijs', String(Math.round(prijsVanaf)));
  offerteParams.set('urgentie', tier.key);
  offerteParams.set('urgentie_label', tier.badge);
  const offerteFullHref = `${offerteHref}?${offerteParams.toString()}`;

  const buttons = {
    bel: (
      <a
        href={CONTACT.telefoonHref}
        className="inline-flex items-center justify-center gap-2 rounded-md bg-cta text-cta-foreground font-semibold px-5 py-3 hover:opacity-90 transition"
      >
        <Phone className="h-5 w-5" /> Bel direct {CONTACT.telefoon}
      </a>
    ),
    whatsapp: (
      <a
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-2 rounded-md bg-[#25D366] text-white font-semibold px-5 py-3 hover:opacity-90 transition"
      >
        <MessageCircle className="h-5 w-5" /> WhatsApp ons direct
      </a>
    ),
    offerte: (
      <Link
        to={offerteFullHref}
        className="inline-flex items-center justify-center gap-2 rounded-md bg-cta text-cta-foreground font-semibold px-5 py-3 hover:opacity-90 transition"
      >
        <FileText className="h-5 w-5" /> Vraag offerte aan
      </Link>
    ),
  };

  const primary = buttons[tier.primary];
  const secondary =
    tier.primary === 'bel' ? buttons.whatsapp : tier.primary === 'whatsapp' ? buttons.bel : buttons.whatsapp;
  const tertiary = tier.primary === 'offerte' ? buttons.bel : buttons.offerte;

  if (variant === 'compact') {
    return (
      <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${tier.badgeColor}`}>
            <Icon className="h-3 w-3" />
            {tier.badge}
          </span>
        </div>
        <p className="font-display font-semibold text-sm">{titel}</p>
        <p className="text-xs text-muted-foreground">{subtitel}</p>
        <div className="flex flex-col gap-2">
          {primary}
          {secondary}
        </div>
      </div>
    );
  }

  return (
    <section className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 p-6 md:p-8">
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${tier.badgeColor}`}>
          <Icon className="h-3.5 w-3.5" />
          {tier.badge}
        </span>
        {prijsVanaf != null && prijsVanaf > 0 && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-card border border-border">
            Indicatie {formatPrijsRange(prijsVanaf)} excl. BTW
          </span>
        )}
      </div>
      <h3 className="font-display text-xl md:text-2xl font-bold mb-2">{titel}</h3>
      <p className="text-muted-foreground mb-5">{subtitel}</p>
      <div className="flex flex-wrap gap-3">
        {primary}
        {secondary}
        <span className="hidden md:inline-flex">{tertiary}</span>
      </div>
    </section>
  );
}
