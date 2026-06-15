import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { slugify } from '@/lib/slugify';
import { PlaceSearch, type PlaceResult } from '@/components/admin/PlaceSearch';
import { Loader2, Plus, RefreshCw, Search, X } from 'lucide-react';

interface NlPlaats {
  id: string;
  naam: string;
  slug: string;
  gemeente: string | null;
  provincie: string | null;
}

const AdminNlPlaatsen = () => {
  const [plaatsen, setPlaatsen] = useState<NlPlaats[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [adding, setAdding] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingPlaces, setPendingPlaces] = useState<PlaceResult[]>([]);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const { toast } = useToast();

  const fetchPlaatsen = async () => {
    setLoading(true);

    let query = supabase
      .from('nl_plaatsen')
      .select('*', { count: 'exact' })
      .order('naam')
      .limit(100);

    if (search) {
      query = query.ilike('naam', `%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching plaatsen:', error);
    } else {
      setPlaatsen(data || []);
      setTotal(count || 0);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPlaatsen();
  }, [search]);

  const handleImport = async () => {
    setImporting(true);

    try {
      const { error } = await supabase.functions.invoke('import-nl-plaatsen');

      if (error) {
        throw error;
      }

      toast({ title: 'Import gestart', description: 'De import draait op de achtergrond.' });

      setTimeout(() => {
        fetchPlaatsen();
        setImporting(false);
      }, 5000);
    } catch (error) {
      console.error('Import error:', error);
      toast({ title: 'Import mislukt', variant: 'destructive' });
      setImporting(false);
    }
  };

  const handleAddSelectedPlaces = async () => {
    if (pendingPlaces.length === 0) return;

    setAdding(true);
    try {
      const { data, error } = await supabase
        .from('nl_plaatsen')
        .upsert(
          pendingPlaces.map((plaats) => ({
            naam: plaats.naam,
            slug: slugify(plaats.naam),
            latitude: plaats.lat,
            longitude: plaats.lon,
          })),
          { onConflict: 'slug' },
        )
        .select('id');

      if (error) throw error;

      toast({ title: `${pendingPlaces.length} plaats(en) toegevoegd`, description: 'Routes worden op de achtergrond aangemaakt.' });
      setDialogOpen(false);
      setPendingPlaces([]);
      fetchPlaatsen();
      (data || []).forEach((plaats) => supabase.functions.invoke('generate-routes-nl-plaats', { body: { plaatsId: plaats.id } }));
    } catch (error) {
      console.error('Add places error:', error);
      toast({ title: 'Fout bij toevoegen plaatsen', variant: 'destructive' });
    } finally {
      setAdding(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold">Nederlandse Plaatsen</h1>
            <p className="text-muted-foreground mt-1">
              {total.toLocaleString('nl-NL')} plaatsen in database
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setPendingPlaces([]); }}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Plaats toevoegen
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nederlandse plaats toevoegen</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <PlaceSearch
                    countryCode="nl"
                    placeholder="Zoek elke Nederlandse plaats (bv. Helmond, Zaandam, Veenendaal)..."
                    onSelect={(p) => {
                      setPendingPlaces((cur) => cur.some((x) => slugify(x.naam) === slugify(p.naam)) ? cur : [...cur, p]);
                    }}
                  />
                  {pendingPlaces.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Geselecteerd ({pendingPlaces.length})</p>
                      <div className="space-y-2 max-h-60 overflow-auto">
                        {pendingPlaces.map((p) => (
                          <div key={p.naam} className="flex items-center justify-between rounded-md border p-2 text-sm">
                            <span className="font-medium">{p.naam}</span>
                            <Button variant="ghost" size="icon" onClick={() => setPendingPlaces((cur) => cur.filter((x) => x.naam !== p.naam))}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <Button className="w-full" onClick={handleAddSelectedPlaces} disabled={adding || pendingPlaces.length === 0}>
                    {adding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Aanmaken + routes genereren
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button onClick={handleImport} disabled={importing}>
              {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              {importing ? 'Importeren...' : 'Top 20 importeren'}
            </Button>
          </div>
        </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Zoek plaats..."
              className="pl-10"
            />
          </div>
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
                    <TableHead>Naam</TableHead>
                    <TableHead>Gemeente</TableHead>
                    <TableHead>Provincie</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plaatsen.map((plaats) => (
                    <TableRow key={plaats.id}>
                      <TableCell className="font-medium">{plaats.naam}</TableCell>
                      <TableCell>{plaats.gemeente || '-'}</TableCell>
                      <TableCell>{plaats.provincie || '-'}</TableCell>
                    </TableRow>
                  ))}
                  {plaatsen.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                        {search ? 'Geen plaatsen gevonden' : 'Nog geen plaatsen geïmporteerd. Klik op "Plaatsen importeren" om te starten.'}
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

export default AdminNlPlaatsen;