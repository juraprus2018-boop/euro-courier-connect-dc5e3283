
ALTER TABLE public.aanvragen
  ADD COLUMN IF NOT EXISTS lading_items jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS verwachte_prijs numeric,
  ADD COLUMN IF NOT EXISTS verwachte_looptijd text,
  ADD COLUMN IF NOT EXISTS transport_type text DEFAULT 'wegtransport',
  ADD COLUMN IF NOT EXISTS afstand_km numeric,
  ADD COLUMN IF NOT EXISTS rijtijd_minuten numeric;
