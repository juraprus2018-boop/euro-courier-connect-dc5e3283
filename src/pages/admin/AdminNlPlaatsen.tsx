import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { slugify } from '@/lib/slugify';
import { NL_PLACE_OPTIONS } from '@/lib/placeOptions';
import { Loader2, Plus, RefreshCw, Search } from 'lucide-react';

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
  const [selectedPlaces, setSelectedPlaces] = useState<string[]>([]);
  const [existingSlugs, setExistingSlugs] = useState<string[]>([]);
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

    const [{ data, error, count }, { data: slugData }] = await Promise.all([
      query,
      supabase.from('nl_plaatsen').select('slug').limit(1000),
    ]);

    if (error) {
      console.error('Error fetching plaatsen:', error);
    } else {
      setPlaatsen(data || []);
      setTotal(count || 0);
      setExistingSlugs((slugData || []).map((item) => item.slug));
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
      
      // Wait a bit and refresh
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

  const missingPlaceOptions = NL_PLACE_OPTIONS.filter((plaats) => !existingSlugs.includes(slugify(plaats.naam)));

  const handleAddSelectedPlaces = async () => {
    const placesToAdd = NL_PLACE_OPTIONS.filter((plaats) => selectedPlaces.includes(plaats.naam));
    if (placesToAdd.length === 0) return;

    setAdding(true);
    try {
      const { data, error } = await supabase
        .from('nl_plaatsen')
        .upsert(
          placesToAdd.map((plaats) => ({
            naam: plaats.naam,
            slug: slugify(plaats.naam),
            latitude: plaats.lat,
            longitude: plaats.lon,
          })),
          { onConflict: 'slug' },
        )
        .select('id');

      if (error) throw error;

      toast({ title: `${placesToAdd.length} plaats(en) toegevoegd`, description: 'Routes worden op de achtergrond aangemaakt.' });
      setDialogOpen(false);
      setSelectedPlaces([]);
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
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Plaats kiezen
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nederlandse plaatsen toevoegen</DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-80 pr-4">
                  <div className="space-y-3">
                    {missingPlaceOptions.map((plaats) => (
                      <label key={plaats.naam} className="flex items-center gap-3 rounded-md border p-3 text-sm">
                        <Checkbox
                          checked={selectedPlaces.includes(plaats.naam)}
                          onCheckedChange={(checked) => {
                            setSelectedPlaces((current) => checked
                              ? [...current, plaats.naam]
                              : current.filter((naam) => naam !== plaats.naam));
                          }}
                        />
                        <span className="font-medium">{plaats.naam}</span>
                      </label>
                    ))}
                    {missingPlaceOptions.length === 0 && (
                      <p className="py-8 text-center text-muted-foreground">Alle beschikbare plaatsen zijn al toegevoegd.</p>
                    )}
                  </div>
                </ScrollArea>
                <Button onClick={handleAddSelectedPlaces} disabled={adding || selectedPlaces.length === 0}>
                  {adding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Aanmaken + routes genereren
                </Button>
              </DialogContent>
            </Dialog>
            <Button onClick={handleImport} disabled={importing}>
              {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              {importing ? 'Importeren...' : 'Top 20 importeren'}
            </Button>
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