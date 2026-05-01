import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useLand } from '@/hooks/useLand';
import { AddressAutocomplete } from './AddressAutocomplete';

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
}

export function QuoteForm({ routeId, landId, defaultOphaalPlaats, defaultAfleverPlaats }: QuoteFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();
  const { land, isHoofdsite } = useLand();

  // Ophaal = altijd Nederland. Aflever = land van domein, of alle landen op hoofdsite.
  const ophaalCountries = 'nl';
  const afleverCountries = !isHoofdsite && land?.iso_code ? land.iso_code : undefined;
  const afleverPlaceholder = afleverCountries
    ? `Adres in ${land?.naam}`
    : 'Begin met typen...';

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
    },
  });

  const ophaalAdres = watch('ophaal_adres');
  const afleverAdres = watch('aflever_adres');

  const onSubmit = async (data: QuoteFormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('aanvragen').insert({
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
      });

      if (error) throw error;

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
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Adressen met autocomplete */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ophaal_adres">Ophaaladres in Nederland *</Label>
              <AddressAutocomplete
                id="ophaal_adres"
                value={ophaalAdres || ''}
                countryCodes={ophaalCountries}
                onChange={(v) => setValue('ophaal_adres', v, { shouldValidate: true })}
                onSelect={(s) => {
                  if (s.postcode) setValue('ophaal_postcode', s.postcode);
                  const plaats = s.city || s.display_name.split(',')[1]?.trim() || '';
                  if (plaats) setValue('ophaal_plaats', plaats, { shouldValidate: true });
                }}
                placeholder="Adres of plaats in Nederland"
              />
              {errors.ophaal_adres && <p className="text-sm text-destructive">{errors.ophaal_adres.message}</p>}
              <div className="grid grid-cols-2 gap-2">
                <Input {...register('ophaal_postcode')} placeholder="Postcode" />
                <Input {...register('ophaal_plaats')} placeholder="Plaats" />
              </div>
              {errors.ophaal_plaats && <p className="text-sm text-destructive">{errors.ophaal_plaats.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="aflever_adres">
                Afleveradres {afleverCountries ? `in ${land?.naam}` : ''} *
              </Label>
              <AddressAutocomplete
                id="aflever_adres"
                value={afleverAdres || ''}
                countryCodes={afleverCountries}
                onChange={(v) => setValue('aflever_adres', v, { shouldValidate: true })}
                onSelect={(s) => {
                  if (s.postcode) setValue('aflever_postcode', s.postcode);
                  const plaats = s.city || s.display_name.split(',')[1]?.trim() || '';
                  if (plaats) setValue('aflever_plaats', plaats, { shouldValidate: true });
                }}
                placeholder={afleverPlaceholder}
              />
              {errors.aflever_adres && <p className="text-sm text-destructive">{errors.aflever_adres.message}</p>}
              <div className="grid grid-cols-2 gap-2">
                <Input {...register('aflever_postcode')} placeholder="Postcode" />
                <Input {...register('aflever_plaats')} placeholder="Plaats" />
              </div>
              {errors.aflever_plaats && <p className="text-sm text-destructive">{errors.aflever_plaats.message}</p>}
            </div>
          </div>

          {/* Datum + omschrijving */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="datum">Gewenste datum</Label>
              <Input id="datum" type="date" {...register('datum')} />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="omschrijving">Wat wilt u versturen?</Label>
              <Input
                id="omschrijving"
                {...register('omschrijving')}
                placeholder="Bijv. 1 pallet, 50kg"
              />
            </div>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact_naam">Naam *</Label>
              <Input id="contact_naam" {...register('contact_naam')} placeholder="Jan Jansen" />
              {errors.contact_naam && <p className="text-sm text-destructive">{errors.contact_naam.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_email">E-mail *</Label>
              <Input id="contact_email" type="email" {...register('contact_email')} placeholder="jan@bedrijf.nl" />
              {errors.contact_email && <p className="text-sm text-destructive">{errors.contact_email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_telefoon">Telefoon *</Label>
              <Input id="contact_telefoon" {...register('contact_telefoon')} placeholder="+31 6 12345678" />
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
