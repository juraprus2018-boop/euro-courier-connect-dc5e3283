CREATE TABLE public.seo_paginas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pagina_key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  beschrijving_admin TEXT,
  titel_template TEXT NOT NULL DEFAULT '',
  description_template TEXT NOT NULL DEFAULT '',
  is_dynamisch BOOLEAN NOT NULL DEFAULT false,
  beschikbare_variabelen TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.seo_paginas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read seo_paginas" ON public.seo_paginas FOR SELECT USING (true);
CREATE POLICY "Admins manage seo_paginas" ON public.seo_paginas FOR ALL TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

CREATE TRIGGER update_seo_paginas_updated_at
BEFORE UPDATE ON public.seo_paginas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.seo_paginas (pagina_key, label, beschrijving_admin, titel_template, description_template, is_dynamisch, beschikbare_variabelen) VALUES
('home', 'Homepagina (hoofdsite)', 'De homepagina van deeuropakoerier.nl', 'Spoedkoerier Europa | De Europa Koerier - Snel & betrouwbaar', 'Spoedkoerier door heel Europa. Direct transport van Nederland naar uw bestemming. 24/7 beschikbaar, dagelijks op pad.', false, '{}'),
('home_land', 'Homepagina (landdomein)', 'Homepagina op country-specifieke domeinen, bv. defrankrijkkoerier.nl', 'Spoedkoerier {land} | De {land} Koerier - Dagelijks op pad', 'Spoedkoerier van Nederland naar {land}. Direct van A naar B, 24/7 beschikbaar. Vraag nu een offerte aan!', true, '{land}'),
('contact', 'Contact', null, 'Contact | De Europa Koerier', 'Neem contact op met De Europa Koerier in Eindhoven. Bel 085 7602 999 of mail naar info@deeuropakoerier.nl.', false, '{}'),
('faq', 'FAQ / Veelgestelde vragen', null, 'Veelgestelde vragen | Spoedkoerier Europa', 'Antwoorden op veelgestelde vragen over onze spoedkoeriersdiensten door heel Europa.', false, '{}'),
('prijs_berekenen', 'Prijs berekenen', null, 'Prijs berekenen spoedkoerier | De Europa Koerier', 'Bereken direct de prijs van uw spoedtransport door heel Europa. Snel, transparant en zonder verrassingen.', false, '{}'),
('quote', 'Offerte aanvragen', null, 'Offerte aanvragen spoedkoerier | De Europa Koerier', 'Vraag direct een vrijblijvende offerte aan voor uw spoedtransport.', false, '{}'),
('blog_index', 'Blog overzicht', null, 'Blog & kennisbank | De Europa Koerier', 'Artikelen, tips en uitleg over spoedkoerier, transport en logistiek door heel Europa.', false, '{}'),
('blog_detail', 'Blog artikel detail', 'Standaard SEO als artikel zelf geen meta heeft', '{titel} | Blog De Europa Koerier', '{excerpt}', true, '{titel,excerpt}'),
('routes', 'Routes overzicht', null, 'Spoedkoerier routes naar {land} | De {land} Koerier', 'Bekijk al onze populaire spoedkoerier routes van Nederland naar {land}.', true, '{land}'),
('route_detail', 'Route detail (NL → buitenland)', null, 'Spoedkoerier {nl_plaats} naar {buitenland_stad} | {land}', 'Spoedkoerier van {nl_plaats} naar {buitenland_stad} ({land}). Afstand {afstand} km. Direct van A naar B.', true, '{nl_plaats,buitenland_stad,land,afstand}'),
('bestemmingen', 'Bestemmingen overzicht', null, 'Bestemmingen spoedkoerier {land} | De {land} Koerier', 'Alle bestemmingen waar wij spoedtransport naartoe verzorgen in {land}.', true, '{land}'),
('bestemming_detail', 'Bestemming detail', null, 'Spoedkoerier naar {stad} | {land} | De {land} Koerier', 'Spoedkoerier vanuit Nederland naar {stad} in {land}. Dagelijks op pad, 24/7 beschikbaar.', true, '{stad,land}'),
('laadcapaciteit', 'Laadcapaciteit', null, 'Laadcapaciteit & wagenpark | De Europa Koerier', 'Overzicht van ons wagenpark en de laadcapaciteit voor uw spoedtransport.', false, '{}'),
('certificeringen', 'Certificeringen', null, 'Certificeringen | De Europa Koerier', 'Onze certificeringen en kwaliteitsgaranties voor betrouwbaar spoedtransport.', false, '{}'),
('algemene_voorwaarden', 'Algemene voorwaarden', null, 'Algemene voorwaarden | De Europa Koerier', 'De algemene voorwaarden van De Europa Koerier.', false, '{}'),
('privacybeleid', 'Privacybeleid', null, 'Privacybeleid | De Europa Koerier', 'Lees hoe wij omgaan met uw persoonsgegevens.', false, '{}'),
('service_internationaal', 'Service: Internationaal transport', null, 'Internationaal transport | De Europa Koerier', 'Internationaal spoedtransport door heel Europa. Snel, betrouwbaar en 24/7 beschikbaar.', false, '{}'),
('service_kunst', 'Service: Kunsttransport', null, 'Kunsttransport | De Europa Koerier', 'Veilig kunsttransport door heel Europa, met de juiste zorg en discretie.', false, '{}');