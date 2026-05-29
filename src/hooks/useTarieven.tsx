import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Tarieven {
  bestelwagen: number;
  bakwagen: number;
}

const DEFAULT: Tarieven = { bestelwagen: 0.7, bakwagen: 1.1 };

export function useTarieven() {
  const [tarieven, setTarieven] = useState<Tarieven>(DEFAULT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('instellingen')
      .select('sleutel,waarde')
      .in('sleutel', ['km_tarief_bestelwagen', 'km_tarief_bakwagen'])
      .then(({ data }) => {
        const next: Tarieven = { ...DEFAULT };
        (data || []).forEach((r: any) => {
          const n = parseFloat(String(r.waarde));
          if (!isNaN(n)) {
            if (r.sleutel === 'km_tarief_bestelwagen') next.bestelwagen = n;
            if (r.sleutel === 'km_tarief_bakwagen') next.bakwagen = n;
          }
        });
        setTarieven(next);
        setLoading(false);
      });
  }, []);

  return { tarieven, loading };
}
