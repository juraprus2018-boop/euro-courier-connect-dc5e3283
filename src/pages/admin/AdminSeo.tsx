import { useEffect, useState, useMemo } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save, Search, Globe, RotateCcw } from 'lucide-react';
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

interface Land {
  id: string;
  naam: string;
  domein: string | null;
  vlag: string | null;
}

interface Override {
  pagina_key: string;
  land_id: string;
  titel_template: string | null;
  description_template: string | null;
}

const GLOBAL = '__global__';

export default function AdminSeo() {
  const [items, setItems] = useState<SeoPagina[]>([]);
  const [landen, setLanden] = useState<Land[]>([]);
  const [overrides, setOverrides] = useState<Override[]>([]);
  // Editable buffer: key = `${pagina_key}|${land_id|GLOBAL}`
  const [edits, setEdits] = useState<Record<string, { titel: string; description: string }>>({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [landFilter, setLandFilter] = useState<string>(GLOBAL);

  const load = async () => {
    setLoading(true);
    const [paginasRes, landenRes, overridesRes] = await Promise.all([
      supabase.from('seo_paginas').select('*').order('label'),
      supabase.from('landen').select('id, naam, domein, vlag').eq('actief', true).order('naam'),
      supabase.from('seo_paginas_land_overrides').select('pagina_key, land_id, titel_template, description_template'),
    ]);
    if (paginasRes.error) toast.error('Laden mislukt: ' + paginasRes.error.message);
    setItems((paginasRes.data as SeoPagina[]) || []);
    setLanden((landenRes.data as Land[]) || []);
    setOverrides((overridesRes.data as Override[]) || []);
    setEdits({});
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const getValues = (item: SeoPagina) => {
    const key = `${item.pagina_key}|${landFilter}`;
    if (edits[key]) return edits[key];
    if (landFilter === GLOBAL) {
      return { titel: item.titel_template, description: item.description_template };
    }
    const ov = overrides.find(o => o.pagina_key === item.pagina_key && o.land_id === landFilter);
    return { titel: ov?.titel_template ?? '', description: ov?.description_template ?? '' };
  };

  const setValues = (item: SeoPagina, patch: Partial<{ titel: string; description: string }>) => {
    const key = `${item.pagina_key}|${landFilter}`;
    const current = getValues(item);
    setEdits(prev => ({ ...prev, [key]: { ...current, ...patch } }));
  };

  const save = async (item: SeoPagina) => {
    const key = `${item.pagina_key}|${landFilter}`;
    const vals = getValues(item);
    setSavingKey(key);

    if (landFilter === GLOBAL) {
      const { error } = await supabase
        .from('seo_paginas')
        .update({ titel_template: vals.titel, description_template: vals.description })
        .eq('id', item.id);
      if (error) toast.error('Opslaan mislukt: ' + error.message);
      else {
        toast.success(`SEO opgeslagen: ${item.label}`);
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, titel_template: vals.titel, description_template: vals.description } : i));
        setEdits(prev => { const n = { ...prev }; delete n[key]; return n; });
      }
    } else {
      const { error } = await supabase
        .from('seo_paginas_land_overrides')
        .upsert({
          pagina_key: item.pagina_key,
          land_id: landFilter,
          titel_template: vals.titel || null,
          description_template: vals.description || null,
        }, { onConflict: 'pagina_key,land_id' });
      if (error) toast.error('Opslaan mislukt: ' + error.message);
      else {
        const land = landen.find(l => l.id === landFilter);
        toast.success(`SEO opgeslagen voor ${land?.naam}: ${item.label}`);
        setOverrides(prev => {
          const filtered = prev.filter(o => !(o.pagina_key === item.pagina_key && o.land_id === landFilter));
          return [...filtered, { pagina_key: item.pagina_key, land_id: landFilter, titel_template: vals.titel || null, description_template: vals.description || null }];
        });
        setEdits(prev => { const n = { ...prev }; delete n[key]; return n; });
      }
    }
    setSavingKey(null);
  };

  const reset = async (item: SeoPagina) => {
    if (landFilter === GLOBAL) return;
    const key = `${item.pagina_key}|${landFilter}`;
    setSavingKey(key);
    const { error } = await supabase
      .from('seo_paginas_land_overrides')
      .delete()
      .eq('pagina_key', item.pagina_key)
      .eq('land_id', landFilter);
    if (error) toast.error('Reset mislukt: ' + error.message);
    else {
      toast.success(`Terug naar globaal: ${item.label}`);
      setOverrides(prev => prev.filter(o => !(o.pagina_key === item.pagina_key && o.land_id === landFilter)));
      setEdits(prev => { const n = { ...prev }; delete n[key]; return n; });
    }
    setSavingKey(null);
  };

  const hasOverride = (item: SeoPagina) => {
    if (landFilter === GLOBAL) return false;
    return overrides.some(o => o.pagina_key === item.pagina_key && o.land_id === landFilter);
  };

  const filtered = items.filter(i =>
    i.label.toLowerCase().includes(search.toLowerCase()) ||
    i.pagina_key.toLowerCase().includes(search.toLowerCase())
  );

  const selectedLand = useMemo(() => landen.find(l => l.id === landFilter), [landen, landFilter]);

  return (
    <AdminLayout>
      <div className="container py-8 space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold">SEO beheer</h1>
          <p className="text-muted-foreground mt-1">
            Beheer titel en metabeschrijving per pagina — globaal of per landdomein. Placeholders: <code className="bg-muted px-1 rounded">{`{land}`}</code>, <code className="bg-muted px-1 rounded">{`{stad}`}</code>, <code className="bg-muted px-1 rounded">{`{vlag}`}</code>.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <Select value={landFilter} onValueChange={setLandFilter}>
              <SelectTrigger className="w-[280px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={GLOBAL}>🌍 Globaal (alle domeinen)</SelectItem>
                {landen.map(l => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.vlag || '🏳️'} {l.naam} {l.domein && <span className="text-muted-foreground ml-1">— {l.domein}</span>}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="relative max-w-md flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Zoek pagina..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {landFilter !== GLOBAL && selectedLand && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">
            <p className="font-medium">
              {selectedLand.vlag} Je bewerkt SEO voor <strong>{selectedLand.naam}</strong>
              {selectedLand.domein && <> ({selectedLand.domein})</>}
            </p>
            <p className="text-muted-foreground mt-1">
              Laat een veld leeg om de globale template te gebruiken. Klik "Reset" om terug te vallen op globaal.
            </p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(item => {
              const key = `${item.pagina_key}|${landFilter}`;
              const vals = getValues(item);
              const isOverride = hasOverride(item);
              return (
                <Card key={item.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2 flex-wrap">
                          {item.label}
                          {item.is_dynamisch && <Badge variant="secondary">Dynamisch</Badge>}
                          {isOverride && <Badge>Override actief</Badge>}
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
                        value={vals.titel}
                        onChange={e => setValues(item, { titel: e.target.value })}
                        maxLength={120}
                        placeholder={landFilter !== GLOBAL ? `Globaal: ${item.titel_template}` : ''}
                      />
                      <div className={`text-xs ${vals.titel.length > 65 ? 'text-orange-500' : 'text-muted-foreground'}`}>
                        {vals.titel.length} tekens
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`desc-${item.id}`}>Meta description (max ~160 tekens)</Label>
                      <Textarea
                        id={`desc-${item.id}`}
                        value={vals.description}
                        onChange={e => setValues(item, { description: e.target.value })}
                        rows={2}
                        maxLength={300}
                        placeholder={landFilter !== GLOBAL ? `Globaal: ${item.description_template}` : ''}
                      />
                      <div className={`text-xs ${vals.description.length > 165 ? 'text-orange-500' : 'text-muted-foreground'}`}>
                        {vals.description.length} tekens
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      {landFilter !== GLOBAL && isOverride && (
                        <Button variant="outline" onClick={() => reset(item)} disabled={savingKey === key}>
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Reset naar globaal
                        </Button>
                      )}
                      <Button onClick={() => save(item)} disabled={savingKey === key}>
                        {savingKey === key ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Opslaan
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {filtered.length === 0 && (
              <p className="text-center text-muted-foreground py-12">Geen resultaten.</p>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
