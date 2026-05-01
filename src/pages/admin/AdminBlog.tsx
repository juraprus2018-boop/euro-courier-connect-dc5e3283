import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { slugify } from '@/lib/slugify';
import { Plus, Loader2, Trash2, Pencil, ExternalLink } from 'lucide-react';

interface Artikel {
  id: string;
  titel: string;
  slug: string;
  excerpt: string | null;
  inhoud: string;
  cover_afbeelding_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
  gepubliceerd: boolean;
  gepubliceerd_op: string | null;
  land_id: string | null;
}

interface Land { id: string; naam: string; }

const empty: Omit<Artikel, 'id'> = {
  titel: '', slug: '', excerpt: '', inhoud: '', cover_afbeelding_url: '',
  meta_title: '', meta_description: '', gepubliceerd: false, gepubliceerd_op: null, land_id: null,
};

const AdminBlog = () => {
  const [artikelen, setArtikelen] = useState<Artikel[]>([]);
  const [landen, setLanden] = useState<Land[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Artikel | null>(null);
  const [form, setForm] = useState<Omit<Artikel, 'id'>>(empty);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    const [{ data: arts }, { data: ls }] = await Promise.all([
      supabase.from('blog_artikelen').select('*').order('created_at', { ascending: false }),
      supabase.from('landen').select('id, naam').eq('actief', true).order('naam'),
    ]);
    setArtikelen((arts || []) as Artikel[]);
    setLanden(ls || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm(empty);
    setDialogOpen(true);
  };

  const openEdit = (a: Artikel) => {
    setEditing(a);
    setForm({
      titel: a.titel, slug: a.slug, excerpt: a.excerpt || '', inhoud: a.inhoud,
      cover_afbeelding_url: a.cover_afbeelding_url || '', meta_title: a.meta_title || '',
      meta_description: a.meta_description || '', gepubliceerd: a.gepubliceerd,
      gepubliceerd_op: a.gepubliceerd_op, land_id: a.land_id,
    });
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titel.trim()) { toast({ title: 'Titel is verplicht', variant: 'destructive' }); return; }
    setSaving(true);
    const slug = form.slug.trim() || slugify(form.titel);
    const payload = {
      titel: form.titel.trim(),
      slug,
      excerpt: form.excerpt || null,
      inhoud: form.inhoud,
      cover_afbeelding_url: form.cover_afbeelding_url || null,
      meta_title: form.meta_title || null,
      meta_description: form.meta_description || null,
      gepubliceerd: form.gepubliceerd,
      gepubliceerd_op: form.gepubliceerd && !form.gepubliceerd_op ? new Date().toISOString() : form.gepubliceerd_op,
      land_id: form.land_id,
    };
    const { error } = editing
      ? await supabase.from('blog_artikelen').update(payload).eq('id', editing.id)
      : await supabase.from('blog_artikelen').insert(payload);
    setSaving(false);
    if (error) { toast({ title: 'Opslaan mislukt', description: error.message, variant: 'destructive' }); return; }
    toast({ title: editing ? 'Artikel bijgewerkt' : 'Artikel aangemaakt' });
    setDialogOpen(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Artikel verwijderen?')) return;
    const { error } = await supabase.from('blog_artikelen').delete().eq('id', id);
    if (error) { toast({ title: 'Verwijderen mislukt', description: error.message, variant: 'destructive' }); return; }
    fetchData();
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Blog & kennisbank</h1>
          <p className="text-muted-foreground text-sm">Beheer artikelen voor de hoofdsite en landdomeinen.</p>
        </div>
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> Nieuw artikel</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titel</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Land</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Acties</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {artikelen.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nog geen artikelen.</TableCell></TableRow>
                ) : artikelen.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.titel}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">/{a.slug}</TableCell>
                    <TableCell className="text-sm">{landen.find(l => l.id === a.land_id)?.naam || '— alle —'}</TableCell>
                    <TableCell>
                      {a.gepubliceerd
                        ? <Badge>Gepubliceerd</Badge>
                        : <Badge variant="secondary">Concept</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      {a.gepubliceerd && (
                        <Button asChild variant="ghost" size="icon">
                          <a href={`/blog/${a.slug}`} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /></a>
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => openEdit(a)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(a.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Artikel bewerken' : 'Nieuw artikel'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <Label htmlFor="titel">Titel *</Label>
              <Input id="titel" value={form.titel} onChange={(e) => setForm({ ...form, titel: e.target.value, slug: editing ? form.slug : slugify(e.target.value) })} required />
            </div>
            <div>
              <Label htmlFor="slug">URL slug</Label>
              <Input id="slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} placeholder="automatisch-uit-titel" />
            </div>
            <div>
              <Label htmlFor="excerpt">Korte intro (excerpt)</Label>
              <Textarea id="excerpt" value={form.excerpt || ''} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} rows={2} maxLength={300} />
            </div>
            <div>
              <Label htmlFor="cover">Cover afbeelding URL</Label>
              <Input id="cover" value={form.cover_afbeelding_url || ''} onChange={(e) => setForm({ ...form, cover_afbeelding_url: e.target.value })} placeholder="https://..." />
            </div>
            <div>
              <Label htmlFor="inhoud">Inhoud (markdown) *</Label>
              <Textarea id="inhoud" value={form.inhoud} onChange={(e) => setForm({ ...form, inhoud: e.target.value })} rows={14} className="font-mono text-sm" required />
              <p className="text-xs text-muted-foreground mt-1">Ondersteunt: # ## ### kopjes, **vet**, *cursief*, - lijsten, [link](url)</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="meta-title">Meta title (SEO)</Label>
                <Input id="meta-title" value={form.meta_title || ''} onChange={(e) => setForm({ ...form, meta_title: e.target.value })} maxLength={70} />
              </div>
              <div>
                <Label htmlFor="land">Land (optioneel)</Label>
                <Select value={form.land_id || 'none'} onValueChange={(v) => setForm({ ...form, land_id: v === 'none' ? null : v })}>
                  <SelectTrigger id="land"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Algemeen / hoofdsite —</SelectItem>
                    {landen.map(l => <SelectItem key={l.id} value={l.id}>{l.naam}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="meta-desc">Meta description (SEO)</Label>
              <Textarea id="meta-desc" value={form.meta_description || ''} onChange={(e) => setForm({ ...form, meta_description: e.target.value })} rows={2} maxLength={160} />
            </div>
            <div className="flex items-center gap-3 pt-2 border-t">
              <Switch id="pub" checked={form.gepubliceerd} onCheckedChange={(c) => setForm({ ...form, gepubliceerd: c })} />
              <Label htmlFor="pub">Gepubliceerd</Label>
            </div>
            <Button type="submit" disabled={saving} className="w-full">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? 'Wijzigingen opslaan' : 'Artikel aanmaken'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminBlog;
