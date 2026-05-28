ALTER TABLE public.landen
  ADD COLUMN IF NOT EXISTS bedrijf_naam text,
  ADD COLUMN IF NOT EXISTS adres text,
  ADD COLUMN IF NOT EXISTS postcode text,
  ADD COLUMN IF NOT EXISTS plaats text,
  ADD COLUMN IF NOT EXISTS telefoon text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS kvk text,
  ADD COLUMN IF NOT EXISTS btw text,
  ADD COLUMN IF NOT EXISTS openingstijden text;