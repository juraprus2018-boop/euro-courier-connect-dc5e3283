GRANT INSERT ON public.aanvragen TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aanvragen TO authenticated;
GRANT ALL ON public.aanvragen TO service_role;

DROP POLICY IF EXISTS "Public insert aanvragen" ON public.aanvragen;
DROP POLICY IF EXISTS "Authenticated klant insert aanvragen" ON public.aanvragen;

CREATE POLICY "Iedereen kan offerte aanvragen"
ON public.aanvragen
FOR INSERT
TO anon, authenticated
WITH CHECK (true);