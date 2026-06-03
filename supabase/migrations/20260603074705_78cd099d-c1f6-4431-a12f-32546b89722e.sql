
-- 1. Vlag emoji per land
ALTER TABLE public.landen ADD COLUMN IF NOT EXISTS vlag text;

-- Vul standaard vlaggen op basis van iso_code waar mogelijk (emoji via regional indicator)
UPDATE public.landen
SET vlag = CASE upper(iso_code)
  WHEN 'BE' THEN '🇧🇪' WHEN 'BG' THEN '🇧🇬' WHEN 'DK' THEN '🇩🇰'
  WHEN 'DE' THEN '🇩🇪' WHEN 'FI' THEN '🇫🇮' WHEN 'FR' THEN '🇫🇷'
  WHEN 'GR' THEN '🇬🇷' WHEN 'HU' THEN '🇭🇺' WHEN 'IE' THEN '🇮🇪'
  WHEN 'IT' THEN '🇮🇹' WHEN 'HR' THEN '🇭🇷' WHEN 'LU' THEN '🇱🇺'
  WHEN 'NO' THEN '🇳🇴' WHEN 'AT' THEN '🇦🇹' WHEN 'PL' THEN '🇵🇱'
  WHEN 'PT' THEN '🇵🇹' WHEN 'RO' THEN '🇷🇴' WHEN 'SI' THEN '🇸🇮'
  WHEN 'SK' THEN '🇸🇰' WHEN 'ES' THEN '🇪🇸' WHEN 'CZ' THEN '🇨🇿'
  WHEN 'GB' THEN '🇬🇧' WHEN 'SE' THEN '🇸🇪' WHEN 'CH' THEN '🇨🇭'
  WHEN 'NL' THEN '🇳🇱'
  ELSE vlag
END
WHERE vlag IS NULL AND iso_code IS NOT NULL;

-- 2. Per-domein/land SEO overrides
CREATE TABLE IF NOT EXISTS public.seo_paginas_land_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pagina_key text NOT NULL,
  land_id uuid NOT NULL REFERENCES public.landen(id) ON DELETE CASCADE,
  titel_template text,
  description_template text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (pagina_key, land_id)
);

GRANT SELECT ON public.seo_paginas_land_overrides TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.seo_paginas_land_overrides TO authenticated;
GRANT ALL ON public.seo_paginas_land_overrides TO service_role;

ALTER TABLE public.seo_paginas_land_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read seo overrides"
ON public.seo_paginas_land_overrides FOR SELECT
USING (true);

CREATE POLICY "Admins manage seo overrides"
ON public.seo_paginas_land_overrides FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE TRIGGER trg_seo_overrides_updated
BEFORE UPDATE ON public.seo_paginas_land_overrides
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Voeg {vlag} toe aan beschikbare variabelen op bestaande dynamische pagina's
UPDATE public.seo_paginas
SET beschikbare_variabelen = ARRAY(SELECT DISTINCT unnest(beschikbare_variabelen || ARRAY['vlag','land']))
WHERE is_dynamisch = true;
