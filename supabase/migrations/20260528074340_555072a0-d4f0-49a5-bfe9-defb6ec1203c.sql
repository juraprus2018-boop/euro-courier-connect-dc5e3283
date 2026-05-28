
-- Voeg public_token + uitgebreide status workflow toe aan aanvragen
ALTER TABLE public.aanvragen
  ADD COLUMN IF NOT EXISTS public_token uuid NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS status_updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS verwacht_reactie_voor timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS aanvragen_public_token_uniq ON public.aanvragen(public_token);

-- Vul verwacht_reactie_voor voor bestaande rijen (1 uur na aanvraag)
UPDATE public.aanvragen
  SET verwacht_reactie_voor = created_at + interval '1 hour'
WHERE verwacht_reactie_voor IS NULL;

-- Default voor nieuwe aanvragen: 1 uur na nu
ALTER TABLE public.aanvragen
  ALTER COLUMN verwacht_reactie_voor SET DEFAULT (now() + interval '1 hour');

-- Trigger om status_updated_at automatisch bij te werken
CREATE OR REPLACE FUNCTION public.update_status_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.status_updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS aanvragen_status_updated_at ON public.aanvragen;
CREATE TRIGGER aanvragen_status_updated_at
  BEFORE UPDATE ON public.aanvragen
  FOR EACH ROW
  EXECUTE FUNCTION public.update_status_updated_at();

-- Anonieme lookup via public_token: alleen veilige kolommen exposen via een view
CREATE OR REPLACE VIEW public.aanvraag_status_public AS
  SELECT
    public_token,
    status,
    status_updated_at,
    verwacht_reactie_voor,
    created_at,
    ophaal_plaats,
    aflever_plaats,
    contact_naam
  FROM public.aanvragen;

GRANT SELECT ON public.aanvraag_status_public TO anon, authenticated;
