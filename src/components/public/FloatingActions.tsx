import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageCircle, Phone, FileText, PhoneCall } from 'lucide-react';
import { CONTACT } from '@/lib/contact';
import { supabase } from '@/integrations/supabase/client';
import { TerugbelDialog } from './TerugbelDialog';

const DEFAULT_WA = '+31407676704';

export function FloatingActions() {
  const location = useLocation();
  const [waNumber, setWaNumber] = useState<string>(DEFAULT_WA);
  const [terugbelOpen, setTerugbelOpen] = useState(false);

  useEffect(() => {
    supabase
      .from('instellingen')
      .select('waarde')
      .eq('sleutel', 'whatsapp_nummer')
      .maybeSingle()
      .then(({ data }) => {
        if (data?.waarde) setWaNumber(data.waarde);
      });
  }, []);

  // Verberg op admin pagina's
  if (location.pathname.startsWith('/admin')) return null;

  const waHref = `https://wa.me/${waNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
    'Hallo, ik heb een vraag over een spoedkoerier rit.'
  )}`;

  return (
    <>
      {/* Floating WhatsApp button (alle schermen, rechtsonder) */}
      <a
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat via WhatsApp"
        className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg hover:scale-110 transition-transform animate-fade-in"
      >
        <MessageCircle className="h-7 w-7" />
      </a>

      {/* Sticky mobile CTA bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-border bg-background/95 backdrop-blur shadow-lg">
        <div className="grid grid-cols-3 gap-1 p-2">
          <a
            href={CONTACT.telefoonHref}
            className="flex flex-col items-center justify-center gap-1 rounded-md py-2 text-primary font-semibold text-xs"
          >
            <Phone className="h-5 w-5" />
            Bel direct
          </a>
          <button
            type="button"
            onClick={() => setTerugbelOpen(true)}
            className="flex flex-col items-center justify-center gap-1 rounded-md py-2 text-foreground font-semibold text-xs"
          >
            <PhoneCall className="h-5 w-5" />
            Terugbellen
          </button>
          <a
            href="/offerte"
            className="flex flex-col items-center justify-center gap-1 rounded-md bg-cta py-2 text-cta-foreground font-semibold text-xs"
          >
            <FileText className="h-5 w-5" />
            Offerte
          </a>
        </div>
      </div>

      <TerugbelDialog open={terugbelOpen} onOpenChange={setTerugbelOpen} />
    </>
  );
}
