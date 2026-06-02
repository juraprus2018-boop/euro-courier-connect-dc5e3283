UPDATE public.landen
SET domein = 'www.' || lower(regexp_replace(domein, '^https?://', ''))
WHERE domein IS NOT NULL
  AND domein <> ''
  AND lower(domein) NOT LIKE 'www.%';