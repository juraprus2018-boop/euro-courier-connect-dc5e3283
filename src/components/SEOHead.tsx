import { Helmet } from 'react-helmet-async';
import { useEffect, useState } from 'react';
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

function interpolate(template: string, vars: Record<string, string | number | undefined>) {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const v = vars[key];
    return v === undefined || v === null ? '' : String(v);
  }).replace(/\s+/g, ' ').trim();
}

export function SEOHead({ title, description, landNaam, canonicalPath, noindex, pageKey, variables, jsonLd }: SEOHeadProps) {
  const [override, setOverride] = useState<{ titel?: string; description?: string } | null>(null);
  const [vlag, setVlag] = useState<string>('');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // 1. Resolve land (voor vlag + per-land SEO override)
      let landId: string | null = null;
      let landVlag = '';
      if (landNaam) {
        const { data: landRow } = await supabase
          .from('landen')
          .select('id, vlag')
          .eq('naam', landNaam)
          .maybeSingle();
        if (landRow) {
          landId = landRow.id;
          landVlag = (landRow as any).vlag || '';
        }
      }
      if (!cancelled) setVlag(landVlag);

      if (!pageKey) return;

      // 2. Per-land override eerst, dan globale template
      const vars = { land: landNaam, vlag: landVlag, ...(variables || {}) };

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
      });
    })();

    return () => { cancelled = true; };
  }, [pageKey, landNaam, JSON.stringify(variables)]);

  const siteNaam = landNaam ? `De ${landNaam} Koerier` : 'De Europa Koerier';

  const defaultTitle = landNaam
    ? `Spoedkoerier ${landNaam} | ${siteNaam}${vlag ? ' ' + vlag : ''}`
    : 'Spoedkoerier Europa | De Europa Koerier - Snel & betrouwbaar';

  const defaultDescription = landNaam
    ? `Spoedkoerier van Nederland naar ${landNaam}${vlag ? ' ' + vlag : ''}. Direct van A naar B, 24/7 beschikbaar. Vraag nu een offerte aan!`
    : 'Spoedkoerier door heel Europa. Direct transport van Nederland naar uw bestemming. 24/7 beschikbaar, dagelijks op pad.';

  // Prio: prop > admin override > default
  const finalTitle = title || override?.titel || defaultTitle;
  const finalDescription = description || override?.description || defaultDescription;

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
