import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Phone, Trash2, CheckCircle2 } from 'lucide-react';

interface Verzoek {
  id: string;
  naam: string;
  telefoon: string;
  tijdslot: string | null;
  opmerking: string | null;
  status: string;
  host: string | null;
  created_at: string;
}

const tijdslotLabel: Record<string, string> = {
  'zo-snel-mogelijk': 'Zo snel mogelijk',
  'ochtend': 'Vandaag ochtend',
  'middag': 'Vandaag middag',
  'avond': 'Vandaag avond',
  'morgen': 'Morgen',
};

const AdminTerugbel = () => {
  const [verzoeken, setVerzoeken] = useState<Verzoek[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('terugbel_verzoeken')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) toast({ title: 'Fout bij ophalen', description: error.message, variant: 'destructive' });
    setVerzoeken((data || []) as Verzoek[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const markAfgehandeld = async (id: string) => {
    const { error } = await supabase.from('terugbel_verzoeken').update({ status: 'afgehandeld' }).eq('id', id);
    if (error) toast({ title: 'Fout', description: error.message, variant: 'destructive' });
    else fetchData();
  };

  const verwijder = async (id: string) => {
    if (!confirm('Verzoek verwijderen?')) return;
    const { error } = await supabase.from('terugbel_verzoeken').delete().eq('id', id);
    if (error) toast({ title: 'Fout', description: error.message, variant: 'destructive' });
    else fetchData();
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">Terugbelverzoeken</h1>
        <p className="text-muted-foreground text-sm">Verzoeken via de "Terugbellen" knop op de website.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum</TableHead>
                  <TableHead>Naam</TableHead>
                  <TableHead>Telefoon</TableHead>
                  <TableHead>Tijdslot</TableHead>
                  <TableHead>Opmerking</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Acties</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {verzoeken.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nog geen verzoeken.</TableCell></TableRow>
                ) : verzoeken.map((v) => (
                  <TableRow key={v.id} className={v.status === 'nieuw' ? 'font-medium' : 'opacity-60'}>
                    <TableCell className="text-sm whitespace-nowrap">
                      {new Date(v.created_at).toLocaleString('nl-NL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </TableCell>
                    <TableCell>{v.naam}</TableCell>
                    <TableCell>
                      <a href={`tel:${v.telefoon}`} className="inline-flex items-center gap-1 text-primary hover:underline">
                        <Phone className="h-3 w-3" /> {v.telefoon}
                      </a>
                    </TableCell>
                    <TableCell className="text-sm">{tijdslotLabel[v.tijdslot || ''] || v.tijdslot || '—'}</TableCell>
                    <TableCell className="text-sm max-w-xs truncate">{v.opmerking || '—'}</TableCell>
                    <TableCell>
                      {v.status === 'nieuw'
                        ? <Badge>Nieuw</Badge>
                        : <Badge variant="secondary">Afgehandeld</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      {v.status === 'nieuw' && (
                        <Button variant="ghost" size="icon" onClick={() => markAfgehandeld(v.id)} title="Markeer als afgehandeld">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => verwijder(v.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminTerugbel;
