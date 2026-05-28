import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '@/components/public/Header';
import { Footer } from '@/components/public/Footer';
import { SEOHead } from '@/components/SEOHead';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2, FileText, MapPin, ArrowRight, Plus, Trash2, LogOut, BookMarked, User, Package,
} from 'lucide-react';

interface Aanvraag {
  id: string;
  public_token: string;
  status: string;
  created_at: string;
  ophaal_plaats: string;
  aflever_plaats: string;
  datum: string | null;
  omschrijving: string | null;
}

interface Profiel {
  naam: string | null;
  telefoon: string | null;
  bedrijf: string | null;
  email: string;
}

interface Adres {
  id: string;
  label: string;
  type: string;
  adres: string;
  postcode: string | null;
  plaats: string;
  land: string | null;
}

const STATUS_LABEL: Record<string, string> = {
  nieuw: 'Nieuw — wacht op behandeling',
  in_behandeling: 'In behandeling',
  offerte_verstuurd: 'Offerte verstuurd',
  bevestigd: 'Bevestigd',
  uitgevoerd: 'Uitgevoerd',
  afgewezen: 'Afgewezen',
  geannuleerd: 'Geannuleerd',
};

const AccountDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { toast } = useToast();

  const [aanvragen, setAanvragen] = useState<Aanvraag[]>([]);
  const [profiel, setProfiel] = useState<Profiel | null>(null);
  const [adressen, setAdressen] = useState<Adres[]>([]);
  const [loading, setLoading] = useState(true);

  // Nieuw adres
  const [newAdres, setNewAdres] = useState({ label: '', type: 'beide', adres: '', postcode: '', plaats: '', land: '' });
  const [adresBusy, setAdresBusy] = useState(false);

  // Profiel form
  const [profielForm, setProfielForm] = useState({ naam: '', telefoon: '', bedrijf: '' });
  const [profielBusy, setProfielBusy] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate('/account/login');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const fetchAll = async () => {
      const [aRes, pRes, adrRes] = await Promise.all([
        supabase
          .from('aanvragen')
          .select('id, public_token, status, created_at, ophaal_plaats, aflever_plaats, datum, omschrijving')
          .order('created_at', { ascending: false }),
        supabase
          .from('klant_profielen')
          .select('naam, telefoon, bedrijf, email')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('klant_adressen')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
      ]);
      if (cancelled) return;
      setAanvragen((aRes.data as any) || []);
      if (pRes.data) {
        setProfiel(pRes.data as any);
        setProfielForm({
          naam: pRes.data.naam || '',
          telefoon: pRes.data.telefoon || '',
          bedrijf: pRes.data.bedrijf || '',
        });
      }
      setAdressen((adrRes.data as any) || []);
      setLoading(false);
    };
    fetchAll();
    return () => { cancelled = true; };
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const saveProfiel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setProfielBusy(true);
    const { error } = await supabase
      .from('klant_profielen')
      .upsert({ user_id: user.id, email: user.email!, ...profielForm }, { onConflict: 'user_id' });
    setProfielBusy(false);
    if (error) {
      toast({ title: 'Opslaan mislukt', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Profiel opgeslagen' });
      setProfiel({ ...profielForm, email: user.email! });
    }
  };

  const addAdres = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!newAdres.label || !newAdres.adres || !newAdres.plaats) {
      toast({ title: 'Vul alle verplichte velden in', variant: 'destructive' });
      return;
    }
    setAdresBusy(true);
    const { data, error } = await supabase
      .from('klant_adressen')
      .insert({ user_id: user.id, ...newAdres })
      .select()
      .single();
    setAdresBusy(false);
    if (error) {
      toast({ title: 'Opslaan mislukt', description: error.message, variant: 'destructive' });
    } else {
      setAdressen([data as any, ...adressen]);
      setNewAdres({ label: '', type: 'beide', adres: '', postcode: '', plaats: '', land: '' });
      toast({ title: 'Adres opgeslagen' });
    }
  };

  const deleteAdres = async (id: string) => {
    const { error } = await supabase.from('klant_adressen').delete().eq('id', id);
    if (error) {
      toast({ title: 'Verwijderen mislukt', variant: 'destructive' });
    } else {
      setAdressen(adressen.filter((a) => a.id !== id));
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead title="Mijn account" noindex />
      <Header />
      <main className="flex-1 py-12">
        <div className="container max-w-5xl">
          <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
            <div>
              <h1 className="font-display text-3xl font-bold">Mijn Account</h1>
              <p className="text-muted-foreground">
                Welkom {profiel?.naam || user?.email}
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild className="bg-cta text-cta-foreground hover:brightness-110">
                <Link to="/offerte"><Plus className="mr-2 h-4 w-4" />Nieuwe aanvraag</Link>
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />Uitloggen
              </Button>
            </div>
          </div>

          <Tabs defaultValue="aanvragen">
            <TabsList className="mb-6">
              <TabsTrigger value="aanvragen"><FileText className="mr-2 h-4 w-4" />Aanvragen</TabsTrigger>
              <TabsTrigger value="adressen"><BookMarked className="mr-2 h-4 w-4" />Adresboek</TabsTrigger>
              <TabsTrigger value="profiel"><User className="mr-2 h-4 w-4" />Profiel</TabsTrigger>
            </TabsList>

            {/* AANVRAGEN */}
            <TabsContent value="aanvragen">
              {aanvragen.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Package className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                    <p className="text-muted-foreground mb-4">U heeft nog geen aanvragen.</p>
                    <Button asChild className="bg-cta text-cta-foreground">
                      <Link to="/offerte">Eerste aanvraag indienen</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {aanvragen.map((a) => (
                    <Card key={a.id} className="hover:border-primary/40 transition">
                      <CardContent className="p-5 flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2 font-semibold">
                          <MapPin className="h-4 w-4 text-primary" />
                          {a.ophaal_plaats}
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          <MapPin className="h-4 w-4 text-primary" />
                          {a.aflever_plaats}
                        </div>
                        <span className="inline-flex items-center rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-semibold">
                          {STATUS_LABEL[a.status] || a.status}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(a.created_at).toLocaleDateString('nl-NL')}
                        </span>
                        <Button asChild size="sm" variant="outline" className="ml-auto">
                          <Link to={`/offerte-status/${a.public_token}`}>
                            Status bekijken →
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ADRESSEN */}
            <TabsContent value="adressen">
              <Card className="mb-6">
                <CardContent className="p-6">
                  <h2 className="font-display text-lg font-bold mb-4">Nieuw adres toevoegen</h2>
                  <form onSubmit={addAdres} className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Label *</Label>
                      <Input placeholder="Bijv. Magazijn HQ" value={newAdres.label}
                        onChange={(e) => setNewAdres({ ...newAdres, label: e.target.value })} />
                    </div>
                    <div>
                      <Label>Type</Label>
                      <select
                        className="w-full h-10 rounded-md border border-input bg-background px-3"
                        value={newAdres.type}
                        onChange={(e) => setNewAdres({ ...newAdres, type: e.target.value })}
                      >
                        <option value="beide">Ophaal &amp; aflever</option>
                        <option value="ophaal">Alleen ophaal</option>
                        <option value="aflever">Alleen aflever</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <Label>Adres *</Label>
                      <Input value={newAdres.adres}
                        onChange={(e) => setNewAdres({ ...newAdres, adres: e.target.value })} />
                    </div>
                    <div>
                      <Label>Postcode</Label>
                      <Input value={newAdres.postcode}
                        onChange={(e) => setNewAdres({ ...newAdres, postcode: e.target.value })} />
                    </div>
                    <div>
                      <Label>Plaats *</Label>
                      <Input value={newAdres.plaats}
                        onChange={(e) => setNewAdres({ ...newAdres, plaats: e.target.value })} />
                    </div>
                    <div>
                      <Label>Land</Label>
                      <Input placeholder="Nederland" value={newAdres.land}
                        onChange={(e) => setNewAdres({ ...newAdres, land: e.target.value })} />
                    </div>
                    <div className="md:col-span-2">
                      <Button type="submit" disabled={adresBusy}>
                        {adresBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="mr-2 h-4 w-4" />Adres toevoegen</>}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {adressen.length === 0 ? (
                <p className="text-center text-muted-foreground py-6">Nog geen opgeslagen adressen.</p>
              ) : (
                <div className="space-y-3">
                  {adressen.map((a) => (
                    <Card key={a.id}>
                      <CardContent className="p-4 flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-primary mt-0.5" />
                        <div className="flex-1">
                          <p className="font-semibold">{a.label} <span className="ml-2 text-xs text-muted-foreground">({a.type})</span></p>
                          <p className="text-sm text-muted-foreground">
                            {a.adres}, {a.postcode} {a.plaats}{a.land ? `, ${a.land}` : ''}
                          </p>
                        </div>
                        <Button size="icon" variant="ghost" onClick={() => deleteAdres(a.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* PROFIEL */}
            <TabsContent value="profiel">
              <Card>
                <CardContent className="p-6">
                  <form onSubmit={saveProfiel} className="space-y-4 max-w-md">
                    <div>
                      <Label>E-mailadres</Label>
                      <Input value={user?.email || ''} disabled />
                      <p className="text-xs text-muted-foreground mt-1">Wijzigen via support.</p>
                    </div>
                    <div>
                      <Label htmlFor="p-naam">Naam</Label>
                      <Input id="p-naam" value={profielForm.naam}
                        onChange={(e) => setProfielForm({ ...profielForm, naam: e.target.value })} />
                    </div>
                    <div>
                      <Label htmlFor="p-tel">Telefoon</Label>
                      <Input id="p-tel" value={profielForm.telefoon}
                        onChange={(e) => setProfielForm({ ...profielForm, telefoon: e.target.value })} />
                    </div>
                    <div>
                      <Label htmlFor="p-bedrijf">Bedrijf</Label>
                      <Input id="p-bedrijf" value={profielForm.bedrijf}
                        onChange={(e) => setProfielForm({ ...profielForm, bedrijf: e.target.value })} />
                    </div>
                    <Button type="submit" disabled={profielBusy}>
                      {profielBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Opslaan'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AccountDashboard;
