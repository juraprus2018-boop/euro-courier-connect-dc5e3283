UPDATE public.landen SET
  bedrijf_naam = CASE slug
    WHEN 'duitsland' THEN 'De Duitsland Koerier'
    WHEN 'frankrijk' THEN 'De Frankrijk Koerier'
    WHEN 'kroatie' THEN 'De Kroatië Koerier'
    ELSE COALESCE(bedrijf_naam, 'De ' || naam || ' Koerier')
  END,
  adres = COALESCE(NULLIF(adres,''), 'Pianostraat 17'),
  postcode = COALESCE(NULLIF(postcode,''), '5642 RC'),
  plaats = COALESCE(NULLIF(plaats,''), 'Eindhoven'),
  telefoon = COALESCE(NULLIF(telefoon,''), '085 7602 999'),
  email = COALESCE(NULLIF(email,''),
    CASE
      WHEN domein IS NOT NULL AND domein <> '' THEN 'info@' || regexp_replace(domein, '^www\.', '')
      ELSE 'info@deeuropakoerier.nl'
    END),
  kvk = COALESCE(NULLIF(kvk,''), '63044951'),
  btw = COALESCE(NULLIF(btw,''), 'NL8550.69.764.B.02'),
  openingstijden = COALESCE(NULLIF(openingstijden,''), 'Ma-Vr 08:00-18:00, Za 09:00-17:00, 24/7 spoed beschikbaar');