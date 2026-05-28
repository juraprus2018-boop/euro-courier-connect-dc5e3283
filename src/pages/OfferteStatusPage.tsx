import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Header } from '@/components/public/Header';
import { Footer } from '@/components/public/Footer';
import { PageBreadcrumb } from '@/components/public/PageBreadcrumb';
import { SEOHead } from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, MapPin, ArrowRight, Clock, CheckCircle2, Truck, FileText, PhoneCall } from 'lucide-react';
import { CONTACT } from '@/lib/contact';

interface AanvraagStatus {
  status: string;
  status_updated_at: string;
  verwacht_reactie_voor: string | null;
  created_at: string;
  ophaal_plaats: string;
  aflever_plaats: string;
  contact_naam: string;
}

const STAPPEN = [
  { key: 'nieuw', label: 'Aanvraag ontvangen', icon: FileText },
  { key: 'in_behandeling', label: 'In behandeling', icon: PhoneCall },
  { key: 'offerte_verstuurd', label: 'Offerte verstuurd', icon: CheckCircle2 },
  { key: 'bevestigd', label: 'Onderweg / uitgevoerd', icon: Truck },
];

function statusIndex(status: string): number {
  const map: Record<string, number> = {
    nieuw: 0,
    in_behandeling: 1,
    offerte_verstuurd: 2,
    bevestigd: 3,
    uitgevoerd: 3,
    afgewezen: -1,
    geannuleerd: -1,
  };
  return map[status] ?? 0;
}

function useCountdown(target: Date | null) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (!target) return;
    const i = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(i);
  }, [target?.getTime()]);
  if (!target) return null;
  const ms = target.getTime() - now.getTime();
  if (ms <= 0) return { expired: true, label: 'Reactietijd verstreken — wij nemen z.s.m. contact op' };
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return { expired: false, label: `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}` };
}

const OfferteStatusPage = () => {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<AanvraagStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    const fetchStatus = async () => {
      const { data: rows, error } = await supabase.rpc('get_aanvraag_status', { p_token: token });
      if (cancelled) return;
      if (error || !rows || (Array.isArray(rows) && rows.length === 0)) {
        setNotFound(true);
      } else {
        setData(Array.isArray(rows) ? rows[0] : rows);
      }
      setLoading(false);
    };
    fetchStatus();
    // Refresh elke 30s
    const i = setInterval(fetchStatus, 30000);
    return () => {
      cancelled = true;
      clearInterval(i);
    };
  }, [token]);

  const verwachteReactie = data?.verwacht_reactie_voor ? new Date(data.verwacht_reactie_voor) : null;
  const countdown = useCountdown(data?.status === 'nieuw' ? verwachteReactie : null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="min-h-screen flex flex-col">
        <SEOHead title="Status niet gevonden" noindex />
        <Header />
        <main className="flex-1 py-20 container text-center">
          <h1 className="font-display text-2xl font-bold mb-4">Status niet gevonden</h1>
          <p className="text-muted-foreground mb-6">
            Deze statuslink is ongeldig of verlopen. Controleer de link uit uw bevestigingsmail.
          </p>
          <Link to="/offerte" className="text-primary hover:underline">Nieuwe aanvraag indienen</Link>
        </main>
        <Footer />
      </div>
    );
  }

  const currentIdx = statusIndex(data.status);
  const isCancelled = currentIdx === -1;

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead title="Status van uw offerte-aanvraag" noindex />
      <Header />
      <main className="flex-1 py-12">
        <div className="container max-w-3xl">
          <PageBreadcrumb items={[{ label: 'Status aanvraag' }]} className="mb-6" />
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">Status van uw aanvraag</h1>
          <p className="text-muted-foreground mb-8">
            Beste {data.contact_naam}, hieronder ziet u live de status van uw spoedkoerier-aanvraag.
          </p>

          {/* Route */}
          <Card className="mb-6">
            <CardContent className="p-6 flex items-center gap-3 flex-wrap">
              <MapPin className="h-5 w-5 text-primary" />
              <span className="font-semibold">{data.ophaal_plaats}</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <MapPin className="h-5 w-5 text-primary" />
              <span className="font-semibold">{data.aflever_plaats}</span>
              <span className="ml-auto text-sm text-muted-foreground">
                Aangevraagd {new Date(data.created_at).toLocaleString('nl-NL')}
              </span>
            </CardContent>
          </Card>

          {/* Countdown */}
          {countdown && !isCancelled && (
            <Card className={`mb-6 ${countdown.expired ? 'border-warning/50 bg-warning/5' : 'border-primary/50 bg-primary/5'}`}>
              <CardContent className="p-6 flex items-center gap-4">
                <Clock className={`h-8 w-8 ${countdown.expired ? 'text-warning' : 'text-primary'}`} />
                <div>
                  <p className="text-sm text-muted-foreground">Verwachte reactietijd</p>
                  <p className={`font-display text-2xl font-bold ${countdown.expired ? 'text-warning' : 'text-primary'}`}>
                    {countdown.label}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Progress stappen */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <ol className="relative space-y-6">
                {STAPPEN.map((stap, idx) => {
                  const done = !isCancelled && idx <= currentIdx;
                  const active = !isCancelled && idx === currentIdx;
                  const Icon = stap.icon;
                  return (
                    <li key={stap.key} className="flex items-start gap-4">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition ${
                          done
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-muted text-muted-foreground border-border'
                        } ${active ? 'ring-4 ring-primary/20 animate-pulse' : ''}`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="pt-1.5">
                        <p className={`font-semibold ${done ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {stap.label}
                        </p>
                        {active && (
                          <p className="text-sm text-muted-foreground mt-0.5">
                            Laatst bijgewerkt: {new Date(data.status_updated_at).toLocaleString('nl-NL')}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>

              {isCancelled && (
                <div className="mt-4 rounded-lg border border-destructive/40 bg-destructive/5 p-4">
                  <p className="font-semibold text-destructive">
                    {data.status === 'afgewezen' ? 'Helaas, deze aanvraag is afgewezen.' : 'Deze aanvraag is geannuleerd.'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardContent className="p-6">
              <h2 className="font-display text-lg font-bold mb-3">Vragen? Neem contact op</h2>
              <div className="flex flex-wrap gap-3">
                <a
                  href={CONTACT.telefoonHref}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-5 py-2.5 font-semibold hover:brightness-110 transition"
                >
                  <PhoneCall className="h-4 w-4" /> {CONTACT.telefoon}
                </a>
                <a
                  href={`mailto:${CONTACT.email}`}
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-5 py-2.5 font-semibold hover:bg-muted transition"
                >
                  {CONTACT.email}
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OfferteStatusPage;
