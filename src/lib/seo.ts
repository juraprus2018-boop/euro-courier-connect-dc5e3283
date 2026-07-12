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
    areaServed: [
      { '@type': 'Country', name: 'Netherlands' },
      { '@type': 'Country', name: args.landNaam },
      { '@type': 'City', name: args.nlPlaats, address: { '@type': 'PostalAddress', addressCountry: 'NL' } },
      { '@type': 'City', name: args.buitenlandStad, address: { '@type': 'PostalAddress', addressLocality: args.buitenlandStad } },
    ],
    provider: {
      '@type': 'MovingCompany',
      name: `De ${args.landNaam} Koerier`,
      telephone: PHONE,
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Ekkersrijt 4304',
        postalCode: '5692 DH',
        addressLocality: 'Son en Breugel',
        addressCountry: 'NL',
      },
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'EUR',
      price: args.prijsVanaf,
      url: args.url,
    },
  };
}

function isoDuration(hours: number) {
  if (!isFinite(hours) || hours <= 0) return 'PT1H';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `PT${h}H${m > 0 ? `${m}M` : ''}`;
}

export function howToJsonLd(args: {
  nlPlaats: string;
  buitenlandStad: string;
  landNaam: string;
  afstandKm: number;
  rijtijdUren: number;
}) {
  const { nlPlaats, buitenlandStad, landNaam, afstandKm, rijtijdUren } = args;
  const kmRound = Math.round(afstandKm);
  const rijtijdLabel =
    rijtijdUren > 0
      ? rijtijdUren < 10
        ? `${rijtijdUren.toFixed(1).replace('.', ',')} uur`
        : `${Math.round(rijtijdUren)} uur`
      : 'op aanvraag';
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: `Spoedkoerier boeken van ${nlPlaats} naar ${buitenlandStad}`,
    description: `Zo werkt een directe spoedrit van ${nlPlaats} naar ${buitenlandStad} (${landNaam}): circa ${kmRound} km, geschatte rijtijd ${rijtijdLabel}.`,
    totalTime: isoDuration(rijtijdUren || 1),
    estimatedCost: { '@type': 'MonetaryAmount', currency: 'EUR' },
    step: [
      {
        '@type': 'HowToStep',
        position: 1,
        name: 'Offerte of telefonische aanvraag',
        text: `U vraagt een offerte aan of belt ${PHONE}. Wij bevestigen binnen enkele minuten een vaste prijs voor ${nlPlaats} → ${buitenlandStad}.`,
      },
      {
        '@type': 'HowToStep',
        position: 2,
        name: 'Chauffeur vertrekt vanuit depot',
        text: `Een chauffeur vertrekt direct vanuit ons depot in Son en Breugel richting ${nlPlaats}.`,
      },
      {
        '@type': 'HowToStep',
        position: 3,
        name: `Ophalen in ${nlPlaats}`,
        text: `De zending wordt persoonlijk opgehaald in ${nlPlaats}. Eén chauffeur, één auto, geen overslag.`,
      },
      {
        '@type': 'HowToStep',
        position: 4,
        name: `Directe rit naar ${buitenlandStad} (${landNaam})`,
        text: `Directe rit van circa ${kmRound} km, geschatte rijtijd ${rijtijdLabel}, zonder tussenstops of overladen.`,
      },
      {
        '@type': 'HowToStep',
        position: 5,
        name: `Aflevering in ${buitenlandStad}`,
        text: `Deur-tot-deur aflevering op het opgegeven adres in ${buitenlandStad}, ${landNaam}. U ontvangt direct een leveringsbevestiging.`,
      },
    ],
  };
}

export function localBusinessJsonLd(args: {
  landNaam?: string;
  origin: string;
  areaCities?: Array<{ naam: string; latitude?: number | null; longitude?: number | null }>;
}) {
  const { landNaam, origin, areaCities } = args;
  const naam = landNaam ? `De ${landNaam} Koerier` : 'De Europa Koerier';

  // Compute rough service area circle from average of country cities
  let serviceArea: unknown = undefined;
  const coords = (areaCities || []).filter(
    (c) => c.latitude != null && c.longitude != null,
  );
  if (coords.length > 0) {
    const avgLat = coords.reduce((a, c) => a + Number(c.latitude), 0) / coords.length;
    const avgLng = coords.reduce((a, c) => a + Number(c.longitude), 0) / coords.length;
    // radius = max distance from average (rough, in meters)
    const R = 6371000;
    const rad = (d: number) => (d * Math.PI) / 180;
    const dist = (lat: number, lng: number) => {
      const dLat = rad(lat - avgLat);
      const dLng = rad(lng - avgLng);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(rad(avgLat)) * Math.cos(rad(lat)) * Math.sin(dLng / 2) ** 2;
      return 2 * R * Math.asin(Math.sqrt(a));
    };
    const radius = Math.max(...coords.map((c) => dist(Number(c.latitude), Number(c.longitude))));
    serviceArea = {
      '@type': 'GeoCircle',
      geoMidpoint: { '@type': 'GeoCoordinates', latitude: avgLat, longitude: avgLng },
      geoRadius: Math.round(radius),
    };
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'MovingCompany',
    '@id': `${origin}/#organization`,
    name: naam,
    telephone: PHONE,
    url: origin,
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Ekkersrijt 4304',
      postalCode: '5692 DH',
      addressLocality: 'Son en Breugel',
      addressCountry: 'NL',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 51.4386732,
      longitude: 5.5223595,
    },
    areaServed: [
      { '@type': 'Country', name: 'Netherlands' },
      ...(landNaam ? [{ '@type': 'Country', name: landNaam }] : []),
      ...((areaCities || []).map((c) => ({ '@type': 'City', name: c.naam }))),
    ],
    ...(serviceArea ? { serviceArea } : {}),
  };
}
