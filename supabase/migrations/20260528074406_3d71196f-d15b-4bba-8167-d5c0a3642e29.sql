
-- Vervang view door een veilige RPC functie
DROP VIEW IF EXISTS public.aanvraag_status_public;

CREATE OR REPLACE FUNCTION public.get_aanvraag_status(p_token uuid)
RETURNS TABLE (
  status text,
  status_updated_at timestamptz,
  verwacht_reactie_voor timestamptz,
  created_at timestamptz,
  ophaal_plaats text,
  aflever_plaats text,
  contact_naam text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    a.status,
    a.status_updated_at,
    a.verwacht_reactie_voor,
    a.created_at,
    a.ophaal_plaats,
    a.aflever_plaats,
    a.contact_naam
  FROM public.aanvragen a
  WHERE a.public_token = p_token
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_aanvraag_status(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_aanvraag_status(uuid) TO anon, authenticated;
