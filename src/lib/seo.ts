// SEO helpers voor JSON-LD generatie
const PHONE = '+31857602999';

export function buildRouteFaq(args: {
  nlPlaats: string;
  buitenlandStad: string;
  landNaam: string;
  afstandKm: number;
  prijsBestelwagen: number;
}) {
  const { nlPlaats, buitenlandStad, landNaam, afstandKm, prijsBestelwagen } = args;
  const fmt = (n: number) => `€ ${n.toLocaleString('nl-NL')}`;
  return [
    {
      vraag: `Wat kost een spoedkoerier van ${nlPlaats} naar ${buitenlandStad}?`,
      antwoord: `Een spoedkoerier met bestelwagen van ${nlPlaats} naar ${buitenlandStad} (${landNaam}) kost vanaf ${fmt(prijsBestelwagen)} excl. BTW. De prijs is gebaseerd op ${Math.round(afstandKm)} km direct vervoer zonder omwegen. Voor grotere zendingen geldt een hoger tarief.`,
    },
    {
      vraag: `Hoe lang duurt een transport van ${nlPlaats} naar ${buitenlandStad}?`,
      antwoord: `Onze spoedkoerier rijdt direct van ${nlPlaats} naar ${buitenlandStad}. De gemiddelde rijtijd is afhankelijk van afstand en verkeer, maar leveringen vinden meestal binnen 24 tot 48 uur plaats. Voor extra urgente zendingen rijden wij ook dezelfde dag.`,
    },
    {
      vraag: `Is de spoedkoerier 24/7 beschikbaar voor ${landNaam}?`,
      antwoord: `Ja, wij zijn 365 dagen per jaar dag en nacht beschikbaar voor spoedtransport naar ${landNaam}. Bel ${PHONE} voor directe inzet.`,
    },
    {
      vraag: `Vervoeren jullie ook gevaarlijke stoffen (ADR) naar ${buitenlandStad}?`,
      antwoord: `Ja, wij beschikken over ADR-geschikte voertuigen en gecertificeerde chauffeurs voor het vervoer van gevaarlijke stoffen boven de 1000 punten naar ${buitenlandStad} en de rest van ${landNaam}.`,
    },
    {
      vraag: `Hoe wordt de prijs berekend voor de route ${nlPlaats} naar ${buitenlandStad}?`,
      antwoord: `De prijs wordt berekend op basis van de totale rijafstand (depot → ophaalpunt → bestemming → depot) maal het kilometertarief. Voor deze route is dat circa ${Math.round(afstandKm)} km. Vraag een offerte aan voor de exacte prijs.`,
    },
  ];
}

export function faqJsonLd(faq: { vraag: string; antwoord: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({
      '@type': 'Question',
      name: f.vraag,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.antwoord,
      },
    })),
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

export function serviceJsonLd(args: {
  nlPlaats: string;
  buitenlandStad: string;
  landNaam: string;
  prijsVanaf: number;
  url: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'Spoedkoerier',
    name: `Spoedkoerier ${args.nlPlaats} naar ${args.buitenlandStad}`,
    description: `Direct spoedtransport van ${args.nlPlaats} naar ${args.buitenlandStad} in ${args.landNaam}. Eén chauffeur, geen overlading.`,
    areaServed: { '@type': 'Country', name: args.landNaam },
    provider: {
      '@type': 'MovingCompany',
      name: `De ${args.landNaam} Koerier`,
      telephone: PHONE,
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'EUR',
      price: args.prijsVanaf,
      url: args.url,
    },
  };
}
