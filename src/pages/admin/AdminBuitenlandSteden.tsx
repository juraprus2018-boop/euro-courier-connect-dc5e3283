import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { slugify } from '@/lib/slugify';
import { PlaceSearch, type PlaceResult } from '@/components/admin/PlaceSearch';
import { Plus, Loader2, Trash2, RefreshCw, X, Pencil } from 'lucide-react';

interface Land {
  id: string;
  naam: string;
  iso_code: string | null;
}

interface BuitenlandStad {
  id: string;
  naam: string;
  slug: string;
  route_generatie_status: string;
  land: { naam: string };
}

const AdminBuitenlandSteden = () => {
  const [steden, setSteden] = useState<BuitenlandStad[]>([]);
  const [landen, setLanden] = useState<Land[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [addingSelected, setAddingSelected] = useState(false);
  const [pendingCities, setPendingCities] = useState<PlaceResult[]>([]);
  const [landId, setLandId] = useState<string>('');
  const { toast } = useToast();

  const fetchData = async () => {
    const [{ data: stedenData }, { data: landenData }] = await Promise.all([
      supabase.from('buitenland_steden').select('id, naam, slug, route_generatie_status, land:landen(naam)').order('naam'),
      supabase.from('landen').select('id, naam, iso_code').eq('actief', true).order('naam'),
    ]);

    setSteden((stedenData || []) as unknown as BuitenlandStad[]);
    setLanden((landenData || []) as Land[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const selectedLand = landen.find((land) => land.id === landId);

  const handleAddSelectedCities = async () => {
    if (!landId || pendingCities.length === 0) return;

    setAddingSelected(true);
    try {
      const { data, error } = await supabase
        .from('buitenland_steden')
        .upsert(
          pendingCities.map((city) => ({
            naam: city.naam,
            slug: slugify(city.naam),
            land_id: landId,
            latitude: city.lat,
            longitude: city.lon,
            route_generatie_status: 'pending',
          })),
          { onConflict: 'land_id,slug' },
        )
        .select('id');

      if (error) throw error;

      toast({ title: `${pendingCities.length} stad(en) toegevoegd`, description: 'Routes worden op de achtergrond aangemaakt.' });
      setDialogOpen(false);
      setPendingCities([]);
      setLandId('');
      fetchData();
      (data || []).forEach((stad) => supabase.functions.invoke('generate-routes', { body: { stadId: stad.id } }));
    } catch (error) {
      console.error('Add selected cities error:', error);
      toast({ title: 'Fout bij toevoegen steden', variant: 'destructive' });
    } finally {
      setAddingSelected(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Weet u zeker dat u deze stad wilt verwijderen?')) return;

    const { error } = await supabase.from('buitenland_steden').delete().eq('id', id);

    if (error) {
      toast({ title: 'Fout bij verwijderen', variant: 'destructive' });
    } else {
      toast({ title: 'Stad verwijderd' });
      fetchData();
    }
  };

  const handleRegenerateRoutes = async (id: string) => {
    await supabase.from('buitenland_steden').update({ route_generatie_status: 'pending' }).eq('id', id);
    toast({ title: 'Route generatie gestart' });
    supabase.functions.invoke('generate-routes', { body: { stadId: id } });
    fetchData();
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-warning/10 text-warning',
      generating: 'bg-primary/10 text-primary',
      completed: 'bg-success/10 text-success',
      error: 'bg-destructive/10 text-destructive',
    };
    const labels = {
      pending: 'Wachtend',
      generating: 'Genereren...',
      completed: 'Voltooid',
      error: 'Fout',
    };
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || styles.pending}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold">Buitenlandse Steden</h1>
            <p className="text-muted-foreground mt-1">Voeg steden toe om routes te genereren.</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setPendingCities([]); setLandId(''); } }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Stad toevoegen
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nieuwe stad toevoegen</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="land">Land</Label>
                  <Select value={landId} onValueChange={(value) => { setLandId(value); setPendingCities([]); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer land" />
                    </SelectTrigger>
                    <SelectContent>
                      {landen.map((land) => (
                        <SelectItem key={land.id} value={land.id}>{land.naam}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedLand && !selectedLand.iso_code && (
                  <p className="text-sm text-destructive">Dit land heeft geen ISO-code ingesteld. Voeg de iso_code toe in de database.</p>
                )}

                {selectedLand?.iso_code && (
                  <div className="space-y-2">
                    <Label>Zoek plaats in {selectedLand.naam}</Label>
                    <PlaceSearch
                      countryCode={selectedLand.iso_code}
                      placeholder={`Zoek elke plaats in ${selectedLand.naam}...`}
                      onSelect={(p) => {
                        setPendingCities((cur) => cur.some((x) => slugify(x.naam) === slugify(p.naam)) ? cur : [...cur, p]);
                      }}
                    />
                  </div>
                )}

                {pendingCities.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Geselecteerd ({pendingCities.length})</p>
                    <div className="space-y-2 max-h-60 overflow-auto">
                      {pendingCities.map((p) => (
                        <div key={p.naam} className="flex items-center justify-between rounded-md border p-2 text-sm">
                          <span className="font-medium">{p.naam}</span>
                          <Button variant="ghost" size="icon" onClick={() => setPendingCities((cur) => cur.filter((x) => x.naam !== p.naam))}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button type="button" className="w-full" onClick={handleAddSelectedCities} disabled={addingSelected || !landId || pendingCities.length === 0}>
                  {addingSelected && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Aanmaken + routes genereren
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Stad</TableHead>
                    <TableHead>Land</TableHead>
                    <TableHead>Route Status</TableHead>
                    <TableHead className="w-[100px]">Acties</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {steden.map((stad) => (
                    <TableRow key={stad.id}>
                      <TableCell className="font-medium">{stad.naam}</TableCell>
                      <TableCell>{stad.land?.naam}</TableCell>
                      <TableCell>{getStatusBadge(stad.route_generatie_status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleRegenerateRoutes(stad.id)} title="Regenereer routes">
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(stad.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {steden.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        Nog geen steden toegevoegd
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminBuitenlandSteden;