import { useEffect, useState, useMemo } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, Trash2, CheckCircle2, Circle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { format, formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { StickyNote, Send, Trash } from 'lucide-react';

const STATUS_FLOW = [
  { key: 'nieuw', label: 'Nieuw', color: 'bg-primary/10 text-primary' },
  { key: 'contact', label: 'Contact opgenomen', color: 'bg-warning/10 text-warning' },
  { key: 'offerte_verzonden', label: 'Offerte verstuurd', color: 'bg-accent/10 text-accent' },
  { key: 'geboekt', label: 'Geboekt', color: 'bg-success/10 text-success' },
  { key: 'afgerond', label: 'Afgerond', color: 'bg-muted text-muted-foreground' },
  { key: 'afgewezen', label: 'Afgewezen', color: 'bg-destructive/10 text-destructive' },
];

const STATUS_MAP: Record<string, { label: string; color: string }> = Object.fromEntries(
  STATUS_FLOW.map((s) => [s.key, { label: s.label, color: s.color }])
);

// Backwards compatibility aliases
const STATUS_ALIAS: Record<string, string> = {
  in_behandeling: 'contact',
  akkoord: 'geboekt',
};

interface LadingItem {
  soort: string;
  aantal: number;
  gewicht_kg: number;
}

interface Aanvraag {
  id: string;
  ophaal_adres: string;
  ophaal_postcode: string | null;
  ophaal_plaats: string;
  aflever_adres: string;
  aflever_postcode: string | null;
  aflever_plaats: string;
  contact_naam: string;
  contact_email: string;
  contact_telefoon: string | null;
  zending_type: string | null;
  gewicht_kg: number | null;
  status: string;
  created_at: string;
  opmerkingen: string | null;
  datum: string | null;
  omschrijving: string | null;
  lading_items: LadingItem[] | null;
  verwachte_prijs: number | null;
  verwachte_looptijd: string | null;
  afstand_km: number | null;
  rijtijd_minuten: number | null;
  transport_type: string | null;
}

interface Notitie {
  id: string;
  aanvraag_id: string;
  notitie: string;
  status_bij_notitie: string | null;
  created_at: string;
}

const AdminAanvragen = () => {
  const [aanvragen, setAanvragen] = useState<Aanvraag[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAanvraag, setSelectedAanvraag] = useState<Aanvraag | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [notities, setNotities] = useState<Notitie[]>([]);
  const [notitieCounts, setNotitieCounts] = useState<Record<string, number>>({});
  const [nieuweNotitie, setNieuweNotitie] = useState('');
  const [notitieLoading, setNotitieLoading] = useState(false);
  const { toast } = useToast();

  const normStatus = (s: string) => STATUS_ALIAS[s] || s;

  const fetchAanvragen = async () => {
    const { data, error } = await supabase
      .from('aanvragen')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching aanvragen:', error);
    } else {
      setAanvragen((data as unknown as Aanvraag[]) || []);
    }
    setLoading(false);

    // Counts for notities
    const { data: notData } = await supabase.from('aanvraag_notities' as any).select('aanvraag_id');
    if (notData) {
      const counts: Record<string, number> = {};
      (notData as any[]).forEach((n) => { counts[n.aanvraag_id] = (counts[n.aanvraag_id] || 0) + 1; });
      setNotitieCounts(counts);
    }
  };

  useEffect(() => {
    fetchAanvragen();
  }, []);

  const fetchNotities = async (aanvraagId: string) => {
    const { data, error } = await supabase
      .from('aanvraag_notities' as any)
      .select('*')
      .eq('aanvraag_id', aanvraagId)
      .order('created_at', { ascending: false });
    if (!error && data) setNotities(data as unknown as Notitie[]);
  };

  useEffect(() => {
    if (selectedAanvraag) {
      fetchNotities(selectedAanvraag.id);
      setNieuweNotitie('');
    } else {
      setNotities([]);
    }
  }, [selectedAanvraag?.id]);

  const voegNotitieToe = async () => {
    if (!selectedAanvraag || !nieuweNotitie.trim()) return;
    setNotitieLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('aanvraag_notities' as any).insert({
      aanvraag_id: selectedAanvraag.id,
      notitie: nieuweNotitie.trim(),
      status_bij_notitie: normStatus(selectedAanvraag.status),
      aangemaakt_door: user?.id ?? null,
    });
    setNotitieLoading(false);
    if (error) {
      toast({ title: 'Fout bij opslaan notitie', description: error.message, variant: 'destructive' });
    } else {
      setNieuweNotitie('');
      fetchNotities(selectedAanvraag.id);
      setNotitieCounts((c) => ({ ...c, [selectedAanvraag.id]: (c[selectedAanvraag.id] || 0) + 1 }));
      toast({ title: 'Notitie toegevoegd' });
    }
  };

  const verwijderNotitie = async (id: string) => {
    if (!confirm('Notitie verwijderen?')) return;
    const { error } = await supabase.from('aanvraag_notities' as any).delete().eq('id', id);
    if (error) {
      toast({ title: 'Fout', description: error.message, variant: 'destructive' });
    } else if (selectedAanvraag) {
      fetchNotities(selectedAanvraag.id);
      setNotitieCounts((c) => ({ ...c, [selectedAanvraag.id]: Math.max(0, (c[selectedAanvraag.id] || 1) - 1) }));
    }
  };

  const updateStatus = async (id: string, status: string, opts?: { silent?: boolean }) => {
    const { error } = await supabase.from('aanvragen').update({ status }).eq('id', id);

    if (error) {
      toast({ title: 'Fout bij bijwerken', variant: 'destructive' });
    } else {
      if (!opts?.silent) toast({ title: 'Status bijgewerkt' });
      fetchAanvragen();
    }
  };



  const handleDelete = async (id: string) => {
    if (!confirm('Weet u zeker dat u deze aanvraag wilt verwijderen?')) return;

    const { error } = await supabase.from('aanvragen').delete().eq('id', id);

    if (error) {
      toast({ title: 'Fout bij verwijderen', variant: 'destructive' });
    } else {
      toast({ title: 'Aanvraag verwijderd' });
      fetchAanvragen();
    }
  };

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: aanvragen.length };
    STATUS_FLOW.forEach((s) => (c[s.key] = 0));
    aanvragen.forEach((a) => {
      const s = normStatus(a.status);
      c[s] = (c[s] || 0) + 1;
    });
    return c;
  }, [aanvragen]);

  const filtered = useMemo(() => {
    if (filterStatus === 'all') return aanvragen;
    return aanvragen.filter((a) => normStatus(a.status) === filterStatus);
  }, [aanvragen, filterStatus]);

  const getStatusBadge = (status: string) => {
    const norm = normStatus(status);
    const meta = STATUS_MAP[norm] || STATUS_MAP.nieuw;
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${meta.color}`}>
        {meta.label}
      </span>
    );
  };

  const Stepper = ({ status }: { status: string }) => {
    const norm = normStatus(status);
    const flow = STATUS_FLOW.filter((s) => s.key !== 'afgewezen');
    const idx = flow.findIndex((s) => s.key === norm);
    const isAfgewezen = norm === 'afgewezen';
    return (
      <div className="flex items-center gap-2 flex-wrap">
        {flow.map((s, i) => {
          const done = !isAfgewezen && i <= idx;
          const current = !isAfgewezen && i === idx;
          return (
            <div key={s.key} className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 ${current ? 'font-semibold text-primary' : done ? 'text-foreground' : 'text-muted-foreground'}`}>
                {done ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Circle className="h-4 w-4" />}
                <span className="text-xs">{s.label}</span>
              </div>
              {i < flow.length - 1 && <div className={`h-px w-6 ${i < idx ? 'bg-success' : 'bg-border'}`} />}
            </div>
          );
        })}
        {isAfgewezen && (
          <span className="ml-2 text-xs font-medium text-destructive">Afgewezen</span>
        )}
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold">Aanvragen</h1>
          <p className="text-muted-foreground mt-1">Beheer binnenkomende offerteaanvragen.</p>
        </div>

        <Tabs value={filterStatus} onValueChange={setFilterStatus}>
          <TabsList className="flex flex-wrap h-auto">
            <TabsTrigger value="all">Alle ({counts.all})</TabsTrigger>
            {STATUS_FLOW.map((s) => (
              <TabsTrigger key={s.key} value={s.key}>
                {s.label} ({counts[s.key] || 0})
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

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
                    <TableHead>Datum</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Acties</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((aanvraag) => (
                    <TableRow key={aanvraag.id}>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(aanvraag.created_at), 'd MMM yyyy', { locale: nl })}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{aanvraag.contact_naam}</p>
                          <p className="text-sm text-muted-foreground">{aanvraag.contact_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{aanvraag.ophaal_plaats} → {aanvraag.aflever_plaats}</p>
                      </TableCell>
                      <TableCell>
                        <Select value={normStatus(aanvraag.status)} onValueChange={(value) => updateStatus(aanvraag.id, value)}>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_FLOW.map((s) => (
                              <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => setSelectedAanvraag(aanvraag)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(aanvraag.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Geen aanvragen in deze categorie
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedAanvraag} onOpenChange={() => setSelectedAanvraag(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Aanvraag details</DialogTitle>
          </DialogHeader>
          {selectedAanvraag && (
            <div className="space-y-6">
              <div className="rounded-lg border p-4 bg-muted/30">
                <h4 className="font-semibold text-sm text-muted-foreground mb-3">Workflow status</h4>
                <Stepper status={selectedAanvraag.status} />
                <div className="mt-4">
                  <Select
                    value={normStatus(selectedAanvraag.status)}
                    onValueChange={(value) => {
                      updateStatus(selectedAanvraag.id, value);
                      setSelectedAanvraag({ ...selectedAanvraag, status: value });
                    }}
                  >
                    <SelectTrigger className="w-[220px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_FLOW.map((s) => (
                        <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">Ophaaladres</h4>
                  <p>{selectedAanvraag.ophaal_adres}</p>
                  <p>{selectedAanvraag.ophaal_plaats}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">Afleveradres</h4>
                  <p>{selectedAanvraag.aflever_adres}</p>
                  <p>{selectedAanvraag.aflever_plaats}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">Contact</h4>
                  <p>{selectedAanvraag.contact_naam}</p>
                  <p>{selectedAanvraag.contact_email}</p>
                  <p>{selectedAanvraag.contact_telefoon || '-'}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">Zending</h4>
                  <p>Transport: {selectedAanvraag.transport_type || 'wegtransport'}</p>
                  <p>Laaddatum: {selectedAanvraag.datum ? format(new Date(selectedAanvraag.datum), 'd MMM yyyy', { locale: nl }) : '-'}</p>
                  <p>Totaalgewicht: {selectedAanvraag.gewicht_kg ? `${selectedAanvraag.gewicht_kg} kg` : '-'}</p>
                </div>
              </div>

              {selectedAanvraag.lading_items && selectedAanvraag.lading_items.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">Lading</h4>
                  <div className="rounded-lg border divide-y">
                    {selectedAanvraag.lading_items.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-3 gap-2 p-3 text-sm">
                        <div className="col-span-2"><span className="text-muted-foreground">Soort:</span> {item.soort}</div>
                        <div><span className="text-muted-foreground">Aantal:</span> {item.aantal}</div>
                        <div className="col-span-3 text-muted-foreground text-xs">Gewicht: {item.gewicht_kg} kg/stuk · Subtotaal: {item.aantal * item.gewicht_kg} kg</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(selectedAanvraag.verwachte_prijs != null || selectedAanvraag.afstand_km != null) && (
                <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4">
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">Berekende offerte (op moment van aanvraag)</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Verwachte prijs</p>
                      <p className="text-xl font-bold text-primary">
                        {selectedAanvraag.verwachte_prijs != null ? `€${selectedAanvraag.verwachte_prijs}` : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Afstand</p>
                      <p className="text-xl font-bold">
                        {selectedAanvraag.afstand_km != null ? `${Math.round(selectedAanvraag.afstand_km)} km` : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Looptijd</p>
                      <p className="text-xl font-bold">
                        {selectedAanvraag.verwachte_looptijd || '-'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {selectedAanvraag.omschrijving && (
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">Omschrijving</h4>
                  <p className="text-sm">{selectedAanvraag.omschrijving}</p>
                </div>
              )}

              {selectedAanvraag.opmerkingen && (
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">Opmerkingen</h4>
                  <p className="text-sm">{selectedAanvraag.opmerkingen}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminAanvragen;