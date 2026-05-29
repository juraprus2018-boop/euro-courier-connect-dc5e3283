CREATE TABLE public.aanvraag_notities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  aanvraag_id UUID NOT NULL,
  notitie TEXT NOT NULL,
  status_bij_notitie TEXT,
  aangemaakt_door UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_aanvraag_notities_aanvraag ON public.aanvraag_notities(aanvraag_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.aanvraag_notities TO authenticated;
GRANT ALL ON public.aanvraag_notities TO service_role;

ALTER TABLE public.aanvraag_notities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage aanvraag_notities"
ON public.aanvraag_notities
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));