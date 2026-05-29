import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BookUser, Loader2, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useLand } from '@/hooks/useLand';
import { useAuth } from '@/hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AddressAutocomplete } from './AddressAutocomplete';

interface KlantAdres {
  id: string;
  label: string;
  type: string;
  adres: string;
  postcode: string | null;
  plaats: string;
  land: string | null;
}

const quoteSchema = z.object({
  ophaal_adres: z.string().min(1, 'Ophaaladres is verplicht').max(500),
  ophaal_postcode: z.string().max(20).optional(),
  ophaal_plaats: z.string().min(1, 'Ophaalplaats is verplicht').max(100),
  aflever_adres: z.string().min(1, 'Afleveradres is verplicht').max(500),
  aflever_postcode: z.string().max(20).optional(),
  aflever_plaats: z.string().min(1, 'Afleverplaats is verplicht').max(100),
  datum: z.string().optional(),
  omschrijving: z.string().max(2000).optional(),
  contact_naam: z.string().min(1, 'Naam is verplicht').max(100),
  contact_email: z.string().email('Ongeldig e-mailadres').max(255),
  contact_telefoon: z.string().min(1, 'Telefoonnummer is verplicht').max(50),
});

type QuoteFormData = z.infer<typeof quoteSchema>;

interface QuoteFormProps {
  routeId?: string;
  landId?: string;
  defaultOphaalPlaats?: string;
  defaultAfleverPlaats?: string;
  defaultOmschrijving?: string;
  /** Korte urgentie-omschrijving (bv. "Binnen 2 uur ter plaatse") wordt opgeslagen in opmerkingen */
  urgentieLabel?: string;
  /** Vooraf berekende afstand (km) */
  afstandKm?: number;
}

export function QuoteForm({
  routeId,
  landId,
  defaultOphaalPlaats,
  defaultAfleverPlaats,
  defaultOmschrijving,
  urgentieLabel,
  afstandKm,
}: QuoteFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [statusToken, setStatusToken] = useState<string | null>(null);

  const { toast } = useToast();
  const { land, isHoofdsite } = useLand();
  const { user } = useAuth();
  const [adresboek, setAdresboek] = useState<KlantAdres[]>([]);

  const [autofilled, setAutofilled] = useState(false);

  useEffect(() => {
    if (!user) {
      setAdresboek([]);
      return;
    }
    supabase
      .from('klant_adressen')
      .select('id,label,type,adres,postcode,plaats,land')
      .order('label', { ascending: true })
      .then(({ data }) => setAdresboek((data as KlantAdres[]) || []));
  }, [user]);

  const ophaalCountries = 'nl';
  const afleverCountries = !isHoofdsite && land?.iso_code ? land.iso_code : undefined;
  const afleverPlaceholder = afleverCountries
    ? `Adres in ${land?.naam}`
    : 'Begin met typen...';

  const ophaalOpties = adresboek.filter((a) => a.type === 'ophaal' || a.type === 'beide');
  const afleverOpties = adresboek.filter((a) => a.type === 'aflever' || a.type === 'beide');

  const kiesAdres = (a: KlantAdres, soort: 'ophaal' | 'aflever') => {
    setValue(`${soort}_adres` as any, a.adres, { shouldValidate: true });
    setValue(`${soort}_postcode` as any, a.postcode || '', { shouldValidate: true });
    setValue(`${soort}_plaats` as any, a.plaats, { shouldValidate: true });
  };



  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<QuoteFormData>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      ophaal_plaats: defaultOphaalPlaats || '',
      aflever_plaats: defaultAfleverPlaats || '',
      ophaal_adres: defaultOphaalPlaats || '',
      aflever_adres: defaultAfleverPlaats || '',
      omschrijving: defaultOmschrijving || '',
    },
  });

  const values = watch();
  const ophaalAdres = values.ophaal_adres;
  const afleverAdres = values.aflever_adres;

  // Autofill profielgegevens + standaard adresboek bij ingelogde klant
  useEffect(() => {
    if (!user || autofilled) return;

    const setIfEmpty = (name: keyof QuoteFormData, val?: string | null) => {
      if (val && !(values[name] as string | undefined)?.trim()) {
        setValue(name, val, { shouldValidate: true });
      }
    };

    let didFill = false;

    // Profielgegevens
    supabase
      .from('klant_profielen')
      .select('naam,email,telefoon')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        const profielNaam = data?.naam || (user.user_metadata as any)?.naam || (user.user_metadata as any)?.full_name;
        const profielEmail = data?.email || user.email;
        const profielTel = data?.telefoon || (user.user_metadata as any)?.telefoon;
        if (profielNaam) { setIfEmpty('contact_naam', profielNaam); didFill = true; }
        if (profielEmail) { setIfEmpty('contact_email', profielEmail); didFill = true; }
        if (profielTel) { setIfEmpty('contact_telefoon', profielTel); didFill = true; }
        if (didFill) setAutofilled(true);
      });
  }, [user, autofilled]);

  // Autofill ophaal/aflever zodra adresboek geladen is
  useEffect(() => {
    if (!user || adresboek.length === 0) return;
    const standaardOphaal = ophaalOpties[0];
    const standaardAflever = afleverOpties[0];
    if (standaardOphaal && !values.ophaal_adres?.trim()) {
      kiesAdres(standaardOphaal, 'ophaal');
      setAutofilled(true);
    }
    if (standaardAflever && !values.aflever_adres?.trim()) {
      kiesAdres(standaardAflever, 'aflever');
      setAutofilled(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adresboek, user]);


  const filled = (name: keyof QuoteFormData, minLen = 1) => {
    const v = values[name];
    return typeof v === 'string' && v.trim().length >= minLen && !errors[name];
  };
  const fieldClass = (name: keyof QuoteFormData, minLen = 1) =>
    filled(name, minLen)
      ? 'border-success bg-success/5 focus-visible:ring-success/40'
      : '';

  const onSubmit = async (data: QuoteFormData) => {
    setIsSubmitting(true);
    try {
      const opmerkingenParts = [
        urgentieLabel ? `Gewenste urgentie: ${urgentieLabel}` : null,
        afstandKm ? `Vooraf berekende afstand: ${Math.round(afstandKm)} km` : null,
      ].filter(Boolean);
      const opmerkingen = opmerkingenParts.length ? opmerkingenParts.join(' · ') : null;

      const { data: inserted, error } = await supabase
        .from('aanvragen')
        .insert({
          route_id: routeId || null,
          land_id: landId || null,
          ophaal_adres: data.ophaal_adres,
          ophaal_postcode: data.ophaal_postcode || null,
          ophaal_plaats: data.ophaal_plaats,
          aflever_adres: data.aflever_adres,
          aflever_postcode: data.aflever_postcode || null,
          aflever_plaats: data.aflever_plaats,
          datum: data.datum || null,
          omschrijving: data.omschrijving || null,
          contact_naam: data.contact_naam,
          contact_email: data.contact_email,
          contact_telefoon: data.contact_telefoon || null,
          afstand_km: afstandKm || null,
          opmerkingen,
        })
        .select('public_token')
        .single();

      if (error) throw error;

      const token = inserted?.public_token as string | undefined;
      const statusUrl = token && typeof window !== 'undefined'
        ? `${window.location.origin}/offerte-status/${token}`
        : undefined;
      if (token) setStatusToken(token);

      // Verstuur notificatie + bevestiging via SMTP (mag niet blokkeren bij fout)
      supabase.functions
        .invoke('send-smtp-email', {
          body: {
            type: 'offerte',
            data: {
              land_id: landId,
              host: typeof window !== 'undefined' ? window.location.host : undefined,
              contact_naam: data.contact_naam,
              contact_email: data.contact_email,
              contact_telefoon: data.contact_telefoon,
              ophaal_adres: data.ophaal_adres,
              ophaal_postcode: data.ophaal_postcode,
              ophaal_plaats: data.ophaal_plaats,
              aflever_adres: data.aflever_adres,
              aflever_postcode: data.aflever_postcode,
              aflever_plaats: data.aflever_plaats,
              datum: data.datum,
              omschrijving: data.omschrijving,
              afstand_km: afstandKm ? Math.round(afstandKm) : undefined,
              urgentie: urgentieLabel,
              opmerkingen,
              status_url: statusUrl,
            },
          },
        })
        .catch((e) => console.error('SMTP send failed:', e));

      setIsSubmitted(true);

      toast({
        title: 'Aanvraag verzonden!',
        description: 'We nemen zo snel mogelijk contact met u op.',
      });
    } catch (error) {
      console.error('Error submitting quote:', error);
      toast({
        title: 'Er ging iets mis',
        description: 'Probeer het later opnieuw.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <Card className="border-success/50 bg-success/5">
        <CardContent className="p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/20">
            <Send className="h-8 w-8 text-success" />
          </div>
          <h3 className="font-display text-xl font-bold">Bedankt voor uw aanvraag!</h3>
          <p className="mt-2 text-muted-foreground">
            We hebben uw offerteaanvraag ontvangen en nemen binnen 1 uur contact met u op.
          </p>
          {statusToken && (
            <a
              href={`/offerte-status/${statusToken}`}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-5 py-2.5 font-semibold hover:brightness-110 transition"
            >
              Volg de status van uw aanvraag →
            </a>
          )}
        </CardContent>
      </Card>
    );
  }


  return (
    <Card>
      <CardContent className="p-6">
        {(urgentieLabel || afstandKm) && (
          <div className="mb-5 rounded-lg border-2 border-primary/30 bg-primary/5 p-4 flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold text-primary">Uw selectie:</span>
            {urgentieLabel && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-primary text-primary-foreground">
                {urgentieLabel}
              </span>
            )}
            {afstandKm && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-card border border-border">
                ± {Math.round(afstandKm)} km
              </span>
            )}
            <span className="text-xs text-muted-foreground ml-auto">Vooraf ingevuld — vul aan en verstuur</span>
          </div>
        )}
        {user && autofilled && (
          <div className="mb-4 rounded-lg border border-success/40 bg-success/5 p-3 text-sm flex items-center gap-2">
            <BookUser className="h-4 w-4 text-success" />
            <span>Velden automatisch ingevuld vanuit uw account en adresboek — controleer en pas eventueel aan.</span>
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="ophaal_adres">Ophaaladres in Nederland *</Label>
                {user && ophaalOpties.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button type="button" variant="outline" size="sm" className="h-7 px-2 text-xs">
                        <BookUser className="h-3.5 w-3.5 mr-1" /> Adresboek
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-72 bg-popover">
                      <DropdownMenuLabel>Kies opgeslagen ophaaladres</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {ophaalOpties.map((a) => (
                        <DropdownMenuItem key={a.id} onSelect={() => kiesAdres(a, 'ophaal')}>
                          <div className="flex flex-col">
                            <span className="font-medium">{a.label}</span>
                            <span className="text-xs text-muted-foreground">{a.adres}, {a.plaats}</span>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              <AddressAutocomplete
                id="ophaal_adres"
                value={ophaalAdres || ''}
                countryCodes={ophaalCountries}
                onChange={(v) => setValue('ophaal_adres', v, { shouldValidate: true })}
                onSelect={(s) => {
                  if (s.postcode) setValue('ophaal_postcode', s.postcode, { shouldValidate: true });
                  const plaats = s.city || s.display_name.split(',')[1]?.trim() || '';
                  if (plaats) setValue('ophaal_plaats', plaats, { shouldValidate: true });
                }}
                placeholder="Adres of plaats in Nederland"
                className={fieldClass('ophaal_adres')}
              />
              {errors.ophaal_adres && <p className="text-sm text-destructive">{errors.ophaal_adres.message}</p>}
              <div className="grid grid-cols-2 gap-2">
                <Input {...register('ophaal_postcode')} placeholder="Postcode" className={fieldClass('ophaal_postcode')} />
                <Input {...register('ophaal_plaats')} placeholder="Plaats" className={fieldClass('ophaal_plaats')} />
              </div>
              {errors.ophaal_plaats && <p className="text-sm text-destructive">{errors.ophaal_plaats.message}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="aflever_adres">
                  Afleveradres {afleverCountries ? `in ${land?.naam}` : ''} *
                </Label>
                {user && afleverOpties.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button type="button" variant="outline" size="sm" className="h-7 px-2 text-xs">
                        <BookUser className="h-3.5 w-3.5 mr-1" /> Adresboek
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-72 bg-popover">
                      <DropdownMenuLabel>Kies opgeslagen afleveradres</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {afleverOpties.map((a) => (
                        <DropdownMenuItem key={a.id} onSelect={() => kiesAdres(a, 'aflever')}>
                          <div className="flex flex-col">
                            <span className="font-medium">{a.label}</span>
                            <span className="text-xs text-muted-foreground">{a.adres}, {a.plaats}</span>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              <AddressAutocomplete
                id="aflever_adres"
                value={afleverAdres || ''}
                countryCodes={afleverCountries}
                onChange={(v) => setValue('aflever_adres', v, { shouldValidate: true })}
                onSelect={(s) => {
                  if (s.postcode) setValue('aflever_postcode', s.postcode, { shouldValidate: true });
                  const plaats = s.city || s.display_name.split(',')[1]?.trim() || '';
                  if (plaats) setValue('aflever_plaats', plaats, { shouldValidate: true });
                }}
                placeholder={afleverPlaceholder}
                className={fieldClass('aflever_adres')}
              />
              {errors.aflever_adres && <p className="text-sm text-destructive">{errors.aflever_adres.message}</p>}
              <div className="grid grid-cols-2 gap-2">
                <Input {...register('aflever_postcode')} placeholder="Postcode" className={fieldClass('aflever_postcode')} />
                <Input {...register('aflever_plaats')} placeholder="Plaats" className={fieldClass('aflever_plaats')} />
              </div>
              {errors.aflever_plaats && <p className="text-sm text-destructive">{errors.aflever_plaats.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="datum">Gewenste datum</Label>
              <Input id="datum" type="date" {...register('datum')} className={fieldClass('datum')} />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="omschrijving">Wat wilt u versturen?</Label>
              <Input
                id="omschrijving"
                {...register('omschrijving')}
                placeholder="Bijv. 1 pallet, 50kg"
                className={fieldClass('omschrijving')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact_naam">Naam *</Label>
              <Input id="contact_naam" {...register('contact_naam')} placeholder="Jan Jansen" className={fieldClass('contact_naam')} />
              {errors.contact_naam && <p className="text-sm text-destructive">{errors.contact_naam.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_email">E-mail *</Label>
              <Input id="contact_email" type="email" {...register('contact_email')} placeholder="jan@bedrijf.nl" className={fieldClass('contact_email', 5)} />
              {errors.contact_email && <p className="text-sm text-destructive">{errors.contact_email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_telefoon">Telefoon *</Label>
              <Input id="contact_telefoon" {...register('contact_telefoon')} placeholder="+31 6 12345678" className={fieldClass('contact_telefoon')} />
              {errors.contact_telefoon && <p className="text-sm text-destructive">{errors.contact_telefoon.message}</p>}
            </div>
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verzenden...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Offerte aanvragen
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
