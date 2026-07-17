import { useState } from 'react';
import { formatPrijsRange, PRIJS_DISCLAIMER } from '@/lib/prijs';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Calculator,
  Calendar,
  Loader2,
  Mail,
  MapPin,
  Package,
  Phone,
  Plus,
  Send,
  Trash2,
  User,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useLand } from '@/hooks/useLand';
import { useTarieven } from '@/hooks/useTarieven';
import { CONTACT } from '@/lib/contact';
import { AddressAutocomplete } from './AddressAutocomplete';


const SOORTEN = [
  'Europallet (120 x 80)',
  'Pallet (120 x 80)',
  'Blokpallet (120 x 100)',
  'CP3-pallet (114 x 114)',
  'CP4-pallet (110 x 130)',
  'Full Trailer Load',
  'Anders',
] as const;

const ladingItemSchema = z.object({
  soort: z.string().min(1, 'Kies een soort'),
  aantal: z.coerce.number().min(1, 'Min. 1'),
  gewicht_kg: z.coerce.number().min(1, 'Min. 1 kg'),
});

const schema = z.object({
  ophaal_adres: z.string().min(1, 'Laadplaats is verplicht').max(500),
  ophaal_postcode: z.string().max(20).optional(),
  ophaal_plaats: z.string().min(1, 'Laadplaats is verplicht').max(100),
  aflever_adres: z.string().min(1, 'Losplaats is verplicht').max(500),
  aflever_postcode: z.string().max(20).optional(),
  aflever_plaats: z.string().min(1, 'Losplaats is verplicht').max(100),
  datum: z.string().min(1, 'Laaddatum is verplicht'),
  lading_items: z.array(ladingItemSchema).min(1, 'Voeg minimaal één lading toe'),
  contact_naam: z.string().min(1, 'Naam is verplicht').max(100),
  contact_email: z.string().email('Ongeldig e-mailadres').max(255),
  contact_telefoon: z.string().min(1, 'Telefoonnummer is verplicht').max(50),
});

type FormData = z.infer<typeof schema>;

interface PriceResult {
  prijs: number;
  afstand_km: number;
  rijtijd_minuten: number;
  looptijd: string;
}

const DEPOT = { lat: 51.4386732, lng: 5.5223595 };

async function geocode(address: string, country?: string) {
  const cc = country ? `&countrycodes=${country}` : '';
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}${cc}&limit=1`,
    { headers: { 'User-Agent': 'DeEuropaKoerier/1.0' } },
  );
  const data = await res.json();
  if (!data?.length) return null;
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

async function osrmDistance(coords: { lat: number; lng: number }[]) {
  const path = coords.map((c) => `${c.lng},${c.lat}`).join(';');
  const res = await fetch(
    `https://router.project-osrm.org/route/v1/driving/${path}?overview=false`,
  );
  const data = await res.json();
  if (data.code !== 'Ok' || !data.routes?.length) return null;
  return {
    distance: data.routes[0].distance / 1000,
    duration: data.routes[0].duration / 60,
  };
}

function formatDuration(min: number) {
  if (min >= 60) return `${Math.floor(min / 60)}u ${Math.round(min % 60)}min`;
  return `${Math.round(min)} min`;
}

interface PrijsBerekenenFormProps {
  defaultOphaalPlaats?: string;
  defaultAfleverPlaats?: string;
}

export function PrijsBerekenenForm({
  defaultOphaalPlaats,
  defaultAfleverPlaats,
}: PrijsBerekenenFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [priceResult, setPriceResult] = useState<PriceResult | null>(null);
  const [calcError, setCalcError] = useState<string | null>(null);
  const { toast } = useToast();
  const { land, isHoofdsite } = useLand();
  const { tarieven } = useTarieven();


  const ophaalCountries = 'nl';
  const afleverCountries =
    !isHoofdsite && land?.iso_code ? land.iso_code : undefined;
  const kmTarief = tarieven.bestelwagen;


  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      ophaal_plaats: defaultOphaalPlaats || '',
      aflever_plaats: defaultAfleverPlaats || '',
      ophaal_adres: defaultOphaalPlaats || '',
      aflever_adres: defaultAfleverPlaats || '',
      datum: '',
      lading_items: [{ soort: 'Europallet (120 x 80)', aantal: 1, gewicht_kg: 100 }],
      contact_naam: '',
      contact_email: '',
      contact_telefoon: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lading_items',
  });

  const values = watch();

  const calculatePrice = async () => {
    setCalcError(null);
    if (!values.ophaal_adres || !values.aflever_adres) {
      setCalcError('Vul eerst laad- en losplaats in.');
      return;
    }
    setCalculating(true);
    try {
      const pickup = await geocode(values.ophaal_adres, 'nl');
      if (!pickup) {
        setCalcError('Laadplaats niet gevonden.');
        setCalculating(false);
        return;
      }
      const dest = await geocode(values.aflever_adres, afleverCountries);
      if (!dest) {
        setCalcError('Losplaats niet gevonden.');
        setCalculating(false);
        return;
      }
      const route = await osrmDistance([DEPOT, pickup, dest, DEPOT]);
      if (!route) {
        setCalcError('Kon geen route berekenen.');
        setCalculating(false);
        return;
      }
      const prijs = Math.round(route.distance * kmTarief);
      setPriceResult({
        prijs,
        afstand_km: route.distance,
        rijtijd_minuten: route.duration,
        looptijd: formatDuration(route.duration),
      });

      try {
        await supabase.functions.invoke('log-prijsberekening', {
          body: {
            host: window.location.hostname,
            land_naam: land?.naam ?? null,
            ophaal_adres: values.ophaal_adres,
            aflever_adres: values.aflever_adres,
            pickup_lat: pickup.lat,
            pickup_lng: pickup.lng,
            destination_lat: dest.lat,
            destination_lng: dest.lng,
            afstand_km: route.distance,
            rijtijd_minuten: route.duration,
            km_tarief: kmTarief,
            berekende_prijs: prijs,
            referer: document.referrer || null,
          },
        });
      } catch {/* ignore */}
    } catch {
      setCalcError('Er ging iets mis bij het berekenen.');
    }
    setCalculating(false);
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const totaalGewicht = data.lading_items.reduce(
        (sum, i) => sum + i.aantal * i.gewicht_kg,
        0,
      );
      const omschrijving = data.lading_items
        .map((i) => `${i.aantal}x ${i.soort} (${i.gewicht_kg}kg/stuk)`)
        .join('; ');

      const { error } = await supabase.from('aanvragen').insert({
        ophaal_adres: data.ophaal_adres,
        ophaal_postcode: data.ophaal_postcode || null,
        ophaal_plaats: data.ophaal_plaats,
        aflever_adres: data.aflever_adres,
        aflever_postcode: data.aflever_postcode || null,
        aflever_plaats: data.aflever_plaats,
        datum: data.datum,
        omschrijving,
        gewicht_kg: totaalGewicht,
        lading_items: data.lading_items,
        verwachte_prijs: priceResult?.prijs ?? null,
        verwachte_looptijd: priceResult?.looptijd ?? null,
        afstand_km: priceResult?.afstand_km ?? null,
        rijtijd_minuten: priceResult?.rijtijd_minuten ?? null,
        transport_type: 'wegtransport',
        contact_naam: data.contact_naam,
        contact_email: data.contact_email,
        contact_telefoon: data.contact_telefoon,
      });

      if (error) throw error;

      setIsSubmitted(true);
      toast({
        title: 'Aanvraag verzonden!',
        description: 'We nemen zo snel mogelijk contact met u op.',
      });
    } catch (e) {
      console.error(e);
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
            We hebben uw aanvraag ontvangen en nemen binnen 1 uur contact met u op.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2">
      <CardContent className="p-6 md:p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <section>
            <h3 className="font-display text-xl font-bold mb-1">
              Vul je transportgegevens in
            </h3>
            <p className="text-sm text-muted-foreground mb-5">
              Laad- en losplaats, datum en lading.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ophaal_adres" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" /> Laadplaats *
                </Label>
                <AddressAutocomplete
                  id="ophaal_adres"
                  value={values.ophaal_adres || ''}
                  countryCodes={ophaalCountries}
                  onChange={(v) =>
                    setValue('ophaal_adres', v, { shouldValidate: true })
                  }
                  onSelect={(s) => {
                    if (s.postcode)
                      setValue('ophaal_postcode', s.postcode, {
                        shouldValidate: true,
                      });
                    const plaats =
                      s.city || s.display_name.split(',')[1]?.trim() || '';
                    if (plaats)
                      setValue('ophaal_plaats', plaats, { shouldValidate: true });
                  }}
                  placeholder="Postcode, adres of bedrijfsnaam"
                />
                {errors.ophaal_adres && (
                  <p className="text-sm text-destructive">
                    {errors.ophaal_adres.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="aflever_adres" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" /> Losplaats *
                </Label>
                <AddressAutocomplete
                  id="aflever_adres"
                  value={values.aflever_adres || ''}
                  countryCodes={afleverCountries}
                  onChange={(v) =>
                    setValue('aflever_adres', v, { shouldValidate: true })
                  }
                  onSelect={(s) => {
                    if (s.postcode)
                      setValue('aflever_postcode', s.postcode, {
                        shouldValidate: true,
                      });
                    const plaats =
                      s.city || s.display_name.split(',')[1]?.trim() || '';
                    if (plaats)
                      setValue('aflever_plaats', plaats, { shouldValidate: true });
                  }}
                  placeholder="Postcode, adres of bedrijfsnaam"
                />
                {errors.aflever_adres && (
                  <p className="text-sm text-destructive">
                    {errors.aflever_adres.message}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="datum" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" /> Laaddatum *
                </Label>
                <Input id="datum" type="date" {...register('datum')} />
                {errors.datum && (
                  <p className="text-sm text-destructive">{errors.datum.message}</p>
                )}
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display text-xl font-bold flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" /> Lading
                </h3>
                <p className="text-sm text-muted-foreground">
                  Voeg één of meerdere ladingrijen toe.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid grid-cols-12 gap-3 items-start p-3 rounded-lg border bg-muted/30"
                >
                  <div className="col-span-12 md:col-span-6 space-y-1">
                    <Label className="text-xs">Soort</Label>
                    <Select
                      value={values.lading_items?.[index]?.soort}
                      onValueChange={(v) =>
                        setValue(`lading_items.${index}.soort`, v, {
                          shouldValidate: true,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Kies soort" />
                      </SelectTrigger>
                      <SelectContent>
                        {SOORTEN.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-5 md:col-span-2 space-y-1">
                    <Label className="text-xs">Aantal</Label>
                    <Input
                      type="number"
                      min={1}
                      {...register(`lading_items.${index}.aantal`)}
                    />
                  </div>
                  <div className="col-span-6 md:col-span-3 space-y-1">
                    <Label className="text-xs">Gewicht (kg/stuk)</Label>
                    <Input
                      type="number"
                      min={1}
                      {...register(`lading_items.${index}.gewicht_kg`)}
                    />
                  </div>
                  <div className="col-span-1 flex items-end justify-end h-full">
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        aria-label="Rij verwijderen"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {errors.lading_items && (
              <p className="text-sm text-destructive mt-2">
                {errors.lading_items.message as string}
              </p>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() =>
                append({ soort: 'Europallet (120 x 80)', aantal: 1, gewicht_kg: 100 })
              }
            >
              <Plus className="h-4 w-4 mr-2" /> Extra rij toevoegen
            </Button>
          </section>

          <section>
            <h3 className="font-display text-xl font-bold mb-4">Contactgegevens</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_naam" className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" /> Naam *
                </Label>
                <Input id="contact_naam" {...register('contact_naam')} placeholder="Jan Jansen" />
                {errors.contact_naam && (
                  <p className="text-sm text-destructive">
                    {errors.contact_naam.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" /> Email *
                </Label>
                <Input
                  id="contact_email"
                  type="email"
                  {...register('contact_email')}
                  placeholder="jan@bedrijf.nl"
                />
                {errors.contact_email && (
                  <p className="text-sm text-destructive">
                    {errors.contact_email.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_telefoon" className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" /> Telefoon *
                </Label>
                <Input
                  id="contact_telefoon"
                  {...register('contact_telefoon')}
                  placeholder="+31 6 12345678"
                />
                {errors.contact_telefoon && (
                  <p className="text-sm text-destructive">
                    {errors.contact_telefoon.message}
                  </p>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Vul uw e-mailadres en telefoonnummer in om direct de prijs van het
              transport te tonen. We sturen u daarna eenmalig een e-mail met uw
              transportgegevens.
            </p>
          </section>

          <div className="space-y-4">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full"
              onClick={calculatePrice}
              disabled={calculating}
            >
              {calculating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Berekenen...
                </>
              ) : (
                <>
                  <Calculator className="mr-2 h-4 w-4" /> Bereken prijs
                </>
              )}
            </Button>

            {calcError && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {calcError}
              </div>
            )}

            {priceResult && (
              <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-lg bg-card p-4 border border-border">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                      Bestelwagen (tot 618 kg / 1 pallet)
                    </p>
                    <p className="text-2xl font-bold text-primary leading-tight">
                      {formatPrijsRange(priceResult.prijs) ?? 'Op aanvraag'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">indicatie excl. BTW</p>
                  </div>
                  <div className="rounded-lg bg-card p-4 border border-border">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                      Bakwagen met laadklep (tot 8 pallets)
                    </p>
                    <p className="text-2xl font-bold leading-tight">Prijs op aanvraag</p>
                    <a
                      href={`tel:${CONTACT.telefoon.replace(/[^0-9+]/g, '')}`}
                      className="mt-1 inline-block text-xs font-semibold text-primary hover:underline"
                    >
                      Bel {CONTACT.telefoon} voor maatwerk
                    </a>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm border-t pt-3">
                  <span className="text-muted-foreground">Verwachte looptijd</span>
                  <span className="font-bold">{priceResult.looptijd}</span>
                </div>
                <p className="text-xs text-muted-foreground">{PRIJS_DISCLAIMER}</p>
              </div>
            )}

          </div>

          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting}
            className="w-full bg-cta text-cta-foreground hover:bg-cta/90 shadow-cta animate-cta-pulse"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verzenden...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" /> Offerte afronden
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
