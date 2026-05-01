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
}

function interpolate(template: string, vars: Record<string, string | number | undefined>) {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const v = vars[key];
    return v === undefined || v === null ? '' : String(v);
  }).replace(/\s+/g, ' ').trim();
}

export function SEOHead({ title, description, landNaam, canonicalPath, noindex, pageKey, variables }: SEOHeadProps) {
  const [override, setOverride] = useState<{ titel?: string; description?: string } | null>(null);

  useEffect(() => {
    if (!pageKey) return;
    let cancelled = false;
    supabase
      .from('seo_paginas')
      .select('titel_template, description_template')
      .eq('pagina_key', pageKey)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled || !data) return;
        const vars = { land: landNaam, ...(variables || {}) };
        setOverride({
          titel: data.titel_template ? interpolate(data.titel_template, vars) : undefined,
          description: data.description_template ? interpolate(data.description_template, vars) : undefined,
        });
      });
    return () => { cancelled = true; };
  }, [pageKey, landNaam, JSON.stringify(variables)]);

  const siteNaam = landNaam ? `De ${landNaam} Koerier` : 'De Europa Koerier';

  const defaultTitle = landNaam
    ? `Spoedkoerier ${landNaam} | ${siteNaam} - Dagelijks op pad`
    : 'Spoedkoerier Europa | De Europa Koerier - Snel & betrouwbaar';

  const defaultDescription = landNaam
    ? `Spoedkoerier van Nederland naar ${landNaam}. Direct van A naar B, 24/7 beschikbaar. Vraag nu een offerte aan!`
    : 'Spoedkoerier door heel Europa. Direct transport van Nederland naar uw bestemming. 24/7 beschikbaar, dagelijks op pad.';

  // Prio: prop > admin override > default
  const finalTitle = title || override?.titel || defaultTitle;
  const finalDescription = description || override?.description || defaultDescription;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const path = canonicalPath ?? (typeof window !== 'undefined' ? window.location.pathname : '/');
  const canonicalUrl = `${origin}${path}`;

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
    </Helmet>
  );
}
