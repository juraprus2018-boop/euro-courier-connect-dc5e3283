import { Helmet } from 'react-helmet-async';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SEOHeadProps {
  title?: string;
  description?: string;
  landNaam?: string;
  canonicalPath?: string;
  noindex?: boolean;
  /** Sleutel uit seo_paginas tabel voor admin-beheerde overrides */
  pageKey?: string;
  /** Variabelen om in templates te interpoleren, bv. { land: 'Frankrijk', stad: 'Parijs' } */
  variables?: Record<string, string | number | undefined>;
  /** Extra JSON-LD schema's (FAQPage, BreadcrumbList, Service, etc.) */
  jsonLd?: Record<string, any> | Record<string, any>[];
}

type SeoOverride = {
  titel?: string;
  description?: string;
  source: 'land' | 'global';
  descriptionHasSpecificContext?: boolean;
};

const DOMAIN_LAND_NAMES: Record<string, string> = {
  belgie: 'Belgie',
  kroatie: 'Kroatie',
  tsjechie: 'Tsjechie',
  zwitserland: 'Zwitserland',
  frankrijk: 'Frankrijk',
  duitsland: 'Duitsland',
  spanje: 'Spanje',
  italie: 'Italie',
  polen: 'Polen',
  oostenrijk: 'Oostenrijk',
};

function stripDiacritics(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function detectLandNameFromHostname() {
  if (typeof window === 'undefined') return undefined;

  const hostname = window.location.hostname.toLowerCase().replace(/^www\./, '');
  if (
    hostname.includes('deeuropakoerier.nl') ||
    hostname.includes('localhost') ||
    hostname.includes('lovable')
  ) {
    return undefined;
  }

  const domainMatch = hostname.match(/^de([a-z-]+)koerier\./);
  const koerierMatch = hostname.match(/^koerier-([a-z-]+)\./);
  const slug = domainMatch?.[1] || koerierMatch?.[1];
  if (!slug) return undefined;

  return DOMAIN_LAND_NAMES[slug] || slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function interpolate(template: string, vars: Record<string, string | number | undefined>) {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const v = vars[key];
    return v === undefined || v === null ? '' : String(v);
  }).replace(/\s+/g, ' ').trim();
}

function hasSpecificSeoContext(template?: string) {
  return !!template && /\{(land|stad|nl_plaats|buitenland_stad|titel|excerpt|afstand)\}/.test(template);
}

function landifySeoText(text: string, landNaam: string, siteNaam: string) {
  return text
    .replace(/De Europa Koerier/g, siteNaam)
    .replace(/Spoedkoerier Europa/g, `Spoedkoerier ${landNaam}`)
    .replace(/spoedkoerier Europa/g, `spoedkoerier ${landNaam}`)
    .replace(/door heel Europa/g, `door heel ${landNaam}`)
    .replace(/heel Europa/g, `heel ${landNaam}`)
    .replace(/Nederland naar uw bestemming/g, `Nederland naar ${landNaam}`)
    .replace(/\bEuropa\b/g, landNaam);
}

export function SEOHead({ title, description, landNaam, canonicalPath, noindex, pageKey, variables, jsonLd }: SEOHeadProps) {
  const fallbackLandNaam = useMemo(() => detectLandNameFromHostname(), []);
  const effectiveLandNaam = landNaam || fallbackLandNaam;
  const seoLandNaam = effectiveLandNaam ? stripDiacritics(effectiveLandNaam) : undefined;
  const siteNaam = seoLandNaam ? `De ${seoLandNaam} Koerier` : 'De Europa Koerier';
  const [override, setOverride] = useState<SeoOverride | null>(null);
  const [vlag, setVlag] = useState<string>('');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // 1. Resolve land (voor vlag + per-land SEO override)
      let landId: string | null = null;
      let landVlag = '';
      if (effectiveLandNaam) {
        const { data: landRow } = await supabase
          .from('landen')
          .select('id, vlag')
          .eq('naam', effectiveLandNaam)
          .maybeSingle();
        if (landRow) {
          landId = landRow.id;
          landVlag = (landRow as any).vlag || '';
        }
      }
      if (!cancelled) setVlag(landVlag);

      if (!pageKey) return;

      // 2. Per-land override eerst, dan globale template
      const vars = {
        ...(variables || {}),
        land: seoLandNaam || effectiveLandNaam,
        land_met_accents: effectiveLandNaam,
        site_naam: siteNaam,
        bedrijf: siteNaam,
        vlag: landVlag,
      };

      if (landId) {
        const { data: ov } = await supabase
          .from('seo_paginas_land_overrides')
          .select('titel_template, description_template')
          .eq('pagina_key', pageKey)
          .eq('land_id', landId)
          .maybeSingle();
        if (!cancelled && ov && (ov.titel_template || ov.description_template)) {
          setOverride({
            titel: ov.titel_template ? interpolate(ov.titel_template, vars) : undefined,
            description: ov.description_template ? interpolate(ov.description_template, vars) : undefined,
            source: 'land',
            descriptionHasSpecificContext: true,
          });
          return;
        }
      }

      const { data } = await supabase
        .from('seo_paginas')
        .select('titel_template, description_template')
        .eq('pagina_key', pageKey)
        .maybeSingle();
      if (cancelled || !data) return;
      setOverride({
        titel: data.titel_template ? interpolate(data.titel_template, vars) : undefined,
        description: data.description_template ? interpolate(data.description_template, vars) : undefined,
        source: 'global',
        descriptionHasSpecificContext: hasSpecificSeoContext(data.description_template || undefined),
      });
    })();

    return () => { cancelled = true; };
  }, [pageKey, effectiveLandNaam, seoLandNaam, siteNaam, JSON.stringify(variables)]);

  const defaultTitle = seoLandNaam
    ? `Spoedkoerier ${seoLandNaam} | ${siteNaam}${vlag ? ' ' + vlag : ''}`
    : 'Spoedkoerier Europa | De Europa Koerier - Snel & betrouwbaar';

  const defaultDescription = seoLandNaam
    ? `Spoedkoerier door heel ${seoLandNaam}. Direct transport van Nederland naar ${seoLandNaam}. 24/7 beschikbaar, dagelijks op pad.`
    : 'Spoedkoerier door heel Europa. Direct transport van Nederland naar uw bestemming. 24/7 beschikbaar, dagelijks op pad.';

  // Prio: prop > admin override > default
  const rawTitle = title || override?.titel || defaultTitle;
  const rawDescription = description || (
    seoLandNaam && override?.source === 'global' && !override.descriptionHasSpecificContext
      ? undefined
      : override?.description
  ) || defaultDescription;
  const finalTitle = seoLandNaam ? landifySeoText(rawTitle, seoLandNaam, siteNaam) : rawTitle;
  const finalDescription = seoLandNaam ? landifySeoText(rawDescription, seoLandNaam, siteNaam) : rawDescription;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const path = canonicalPath ?? (typeof window !== 'undefined' ? window.location.pathname : '/');
  const canonicalUrl = `${origin}${path}`;

  // LocalBusiness JSON-LD (altijd aanwezig)
  const localBusinessLd = {
    '@context': 'https://schema.org',
    '@type': 'MovingCompany',
    name: siteNaam,
    description: finalDescription,
    url: origin,
    telephone: '+31857602999',
    email: 'info@deeuropakoerier.nl',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'NL',
      addressLocality: 'Eindhoven',
      postalCode: '5658',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 51.4386732,
      longitude: 5.5223595,
    },
    areaServed: 'Europa',
    openingHours: 'Mo-Su 00:00-23:59',
    priceRange: '€€',
  };

  const extraLd = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];
  const allLd = [localBusinessLd, ...extraLd];

  return (
    <Helmet>
      <html lang="nl" />
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}
      <link rel="canonical" href={canonicalUrl} />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content={siteNaam} />
      <meta property="og:locale" content="nl_NL" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      {allLd.map((ld, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(ld)}</script>
      ))}
    </Helmet>
  );
}
