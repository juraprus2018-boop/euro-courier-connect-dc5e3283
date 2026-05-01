import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Save, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface SeoPagina {
  id: string;
  pagina_key: string;
  label: string;
  beschrijving_admin: string | null;
  titel_template: string;
  description_template: string;
  is_dynamisch: boolean;
  beschikbare_variabelen: string[];
}

export default function AdminSeo() {
  const [items, setItems] = useState<SeoPagina[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('seo_paginas')
      .select('*')
      .order('label');
    if (error) toast.error('Laden mislukt: ' + error.message);
    setItems((data as SeoPagina[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const update = (id: string, patch: Partial<SeoPagina>) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i));
  };

  const save = async (item: SeoPagina) => {
    setSavingId(item.id);
    const { error } = await supabase
      .from('seo_paginas')
      .update({
        titel_template: item.titel_template,
        description_template: item.description_template,
      })
      .eq('id', item.id);
    setSavingId(null);
    if (error) {
      toast.error('Opslaan mislukt: ' + error.message);
    } else {
      toast.success(`SEO opgeslagen: ${item.label}`);
    }
  };

  const filtered = items.filter(i =>
    i.label.toLowerCase().includes(search.toLowerCase()) ||
    i.pagina_key.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="container py-8 space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold">SEO beheer</h1>
          <p className="text-muted-foreground mt-1">
            Beheer titel en metabeschrijving per pagina. Voor dynamische pagina's kun je placeholders gebruiken zoals <code className="bg-muted px-1 rounded">{`{land}`}</code>, <code className="bg-muted px-1 rounded">{`{stad}`}</code>.
          </p>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Zoek pagina..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(item => (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2 flex-wrap">
                        {item.label}
                        {item.is_dynamisch && <Badge variant="secondary">Dynamisch</Badge>}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        <code className="text-xs">{item.pagina_key}</code>
                        {item.beschrijving_admin && <span className="ml-2">— {item.beschrijving_admin}</span>}
                      </CardDescription>
                    </div>
                  </div>
                  {item.beschikbare_variabelen.length > 0 && (
                    <div className="text-xs text-muted-foreground mt-2">
                      Beschikbare placeholders:{' '}
                      {item.beschikbare_variabelen.map(v => (
                        <code key={v} className="bg-muted px-1.5 py-0.5 rounded mr-1">{`{${v}}`}</code>
                      ))}
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`title-${item.id}`}>Titel (max ~60 tekens)</Label>
                    <Input
                      id={`title-${item.id}`}
                      value={item.titel_template}
                      onChange={e => update(item.id, { titel_template: e.target.value })}
                      maxLength={120}
                    />
                    <div className={`text-xs ${item.titel_template.length > 65 ? 'text-orange-500' : 'text-muted-foreground'}`}>
                      {item.titel_template.length} tekens
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`desc-${item.id}`}>Meta description (max ~160 tekens)</Label>
                    <Textarea
                      id={`desc-${item.id}`}
                      value={item.description_template}
                      onChange={e => update(item.id, { description_template: e.target.value })}
                      rows={2}
                      maxLength={300}
                    />
                    <div className={`text-xs ${item.description_template.length > 165 ? 'text-orange-500' : 'text-muted-foreground'}`}>
                      {item.description_template.length} tekens
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={() => save(item)} disabled={savingId === item.id}>
                      {savingId === item.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Opslaan
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-muted-foreground py-12">Geen resultaten.</p>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
