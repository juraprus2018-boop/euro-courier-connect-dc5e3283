
-- ============= klant_profielen =============
CREATE TABLE IF NOT EXISTS public.klant_profielen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  naam text,
  telefoon text,
  bedrijf text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.klant_profielen TO authenticated;
GRANT ALL ON public.klant_profielen TO service_role;

ALTER TABLE public.klant_profielen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Klant ziet eigen profiel"
  ON public.klant_profielen FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Klant maakt eigen profiel"
  ON public.klant_profielen FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Klant bewerkt eigen profiel"
  ON public.klant_profielen FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins beheren profielen"
  ON public.klant_profielen FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER klant_profielen_updated_at
  BEFORE UPDATE ON public.klant_profielen
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============= klant_adressen =============
CREATE TABLE IF NOT EXISTS public.klant_adressen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label text NOT NULL,
  type text NOT NULL DEFAULT 'beide' CHECK (type IN ('ophaal','aflever','beide')),
  adres text NOT NULL,
  postcode text,
  plaats text NOT NULL,
  land text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_klant_adressen_user ON public.klant_adressen(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.klant_adressen TO authenticated;
GRANT ALL ON public.klant_adressen TO service_role;

ALTER TABLE public.klant_adressen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Klant beheert eigen adressen"
  ON public.klant_adressen FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins zien alle adressen"
  ON public.klant_adressen FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE TRIGGER klant_adressen_updated_at
  BEFORE UPDATE ON public.klant_adressen
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============= Aanvragen — klant ziet eigen aanvragen op e-mailadres =============
CREATE POLICY "Klant ziet eigen aanvragen via email"
  ON public.aanvragen FOR SELECT TO authenticated
  USING (
    lower(contact_email) = lower(coalesce((auth.jwt() ->> 'email')::text, ''))
  );

-- Klant kan eigen aanvragen indienen via portaal
CREATE POLICY "Authenticated klant insert aanvragen"
  ON public.aanvragen FOR INSERT TO authenticated
  WITH CHECK (
    lower(contact_email) = lower(coalesce((auth.jwt() ->> 'email')::text, ''))
  );

-- ============= Auto-create profiel bij signup =============
CREATE OR REPLACE FUNCTION public.handle_new_klant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.klant_profielen (user_id, email, naam, telefoon, bedrijf)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'naam', NEW.raw_user_meta_data ->> 'full_name'),
    NEW.raw_user_meta_data ->> 'telefoon',
    NEW.raw_user_meta_data ->> 'bedrijf'
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_klant ON auth.users;
CREATE TRIGGER on_auth_user_created_klant
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_klant();
