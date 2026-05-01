
-- Blog artikelen
CREATE TABLE public.blog_artikelen (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titel TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  inhoud TEXT NOT NULL DEFAULT '',
  cover_afbeelding_url TEXT,
  meta_title TEXT,
  meta_description TEXT,
  gepubliceerd BOOLEAN NOT NULL DEFAULT false,
  gepubliceerd_op TIMESTAMPTZ,
  land_id UUID REFERENCES public.landen(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_blog_artikelen_gepubliceerd ON public.blog_artikelen(gepubliceerd, gepubliceerd_op DESC);
CREATE INDEX idx_blog_artikelen_land ON public.blog_artikelen(land_id);

ALTER TABLE public.blog_artikelen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read gepubliceerde artikelen"
  ON public.blog_artikelen FOR SELECT
  USING (gepubliceerd = true);

CREATE POLICY "Admins manage blog_artikelen"
  ON public.blog_artikelen FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE TRIGGER blog_artikelen_updated_at
  BEFORE UPDATE ON public.blog_artikelen
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Terugbelverzoeken
CREATE TABLE public.terugbel_verzoeken (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  naam TEXT NOT NULL,
  telefoon TEXT NOT NULL,
  tijdslot TEXT,
  opmerking TEXT,
  status TEXT NOT NULL DEFAULT 'nieuw',
  land_id UUID REFERENCES public.landen(id) ON DELETE SET NULL,
  host TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_terugbel_verzoeken_status ON public.terugbel_verzoeken(status, created_at DESC);

ALTER TABLE public.terugbel_verzoeken ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public insert terugbel_verzoeken"
  ON public.terugbel_verzoeken FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins manage terugbel_verzoeken"
  ON public.terugbel_verzoeken FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE TRIGGER terugbel_verzoeken_updated_at
  BEFORE UPDATE ON public.terugbel_verzoeken
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- WhatsApp nummer instelling
INSERT INTO public.instellingen (sleutel, waarde, beschrijving)
VALUES ('whatsapp_nummer', '+31407676704', 'WhatsApp nummer voor floating chat-knop (E.164 formaat)')
ON CONFLICT DO NOTHING;
