import { useState } from 'react';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2, Phone } from 'lucide-react';

const schema = z.object({
  naam: z.string().trim().min(2, 'Vul uw naam in').max(100),
  telefoon: z.string().trim().min(8, 'Vul een geldig telefoonnummer in').max(30),
  tijdslot: z.string().min(1, 'Kies een tijdslot'),
  opmerking: z.string().trim().max(500).optional(),
});

interface TerugbelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TerugbelDialog({ open, onOpenChange }: TerugbelDialogProps) {
  const [naam, setNaam] = useState('');
  const [telefoon, setTelefoon] = useState('');
  const [tijdslot, setTijdslot] = useState('zo-snel-mogelijk');
  const [opmerking, setOpmerking] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ naam, telefoon, tijdslot, opmerking });
    if (!parsed.success) {
      toast({ title: 'Controleer uw gegevens', description: parsed.error.issues[0].message, variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from('terugbel_verzoeken').insert({
      naam: parsed.data.naam,
      telefoon: parsed.data.telefoon,
      tijdslot: parsed.data.tijdslot,
      opmerking: parsed.data.opmerking || null,
      host: typeof window !== 'undefined' ? window.location.host : null,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: 'Er ging iets mis', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Bedankt!', description: 'We bellen u zo spoedig mogelijk terug.' });
    setNaam(''); setTelefoon(''); setOpmerking(''); setTijdslot('zo-snel-mogelijk');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-primary" /> Vraag een terugbelverzoek aan
          </DialogTitle>
          <DialogDescription>
            Laat uw nummer achter, wij bellen u terug binnen het gekozen tijdslot.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="tb-naam">Naam *</Label>
            <Input id="tb-naam" value={naam} onChange={(e) => setNaam(e.target.value)} maxLength={100} required />
          </div>
          <div>
            <Label htmlFor="tb-tel">Telefoonnummer *</Label>
            <Input id="tb-tel" type="tel" value={telefoon} onChange={(e) => setTelefoon(e.target.value)} maxLength={30} required />
          </div>
          <div>
            <Label htmlFor="tb-slot">Wanneer mogen we bellen? *</Label>
            <Select value={tijdslot} onValueChange={setTijdslot}>
              <SelectTrigger id="tb-slot"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="zo-snel-mogelijk">Zo snel mogelijk</SelectItem>
                <SelectItem value="ochtend">Vandaag in de ochtend (9-12)</SelectItem>
                <SelectItem value="middag">Vandaag in de middag (12-17)</SelectItem>
                <SelectItem value="avond">Vandaag in de avond (17-20)</SelectItem>
                <SelectItem value="morgen">Morgen</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="tb-opm">Opmerking (optioneel)</Label>
            <Textarea id="tb-opm" value={opmerking} onChange={(e) => setOpmerking(e.target.value)} maxLength={500} rows={3} />
          </div>
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verstuur terugbelverzoek
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
