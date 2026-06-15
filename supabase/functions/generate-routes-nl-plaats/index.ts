import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const slugify = (text: string) => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const { plaatsId } = await req.json();

  if (!plaatsId) {
    return new Response(JSON.stringify({ success: false, error: 'plaatsId ontbreekt' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: instellingen } = await supabase.from('instellingen').select('sleutel, waarde');
  const settings: Record<string, string> = {};
  instellingen?.forEach((item: { sleutel: string; waarde: string }) => {
    settings[item.sleutel] = item.waarde;
  });

  const kmTarief = parseFloat(settings.km_tarief || '0.50');
  const depotLat = parseFloat(settings.depot_latitude || '51.4386732');
  const depotLon = parseFloat(settings.depot_longitude || '5.5223595');

  const { data: plaats } = await supabase
    .from('nl_plaatsen')
    .select('*')
    .eq('id', plaatsId)
    .single();

  if (!plaats?.latitude || !plaats?.longitude) {
    return new Response(JSON.stringify({ success: false, error: 'Nederlandse plaats niet gevonden of heeft geen coördinaten' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { data: steden } = await supabase
    .from('buitenland_steden')
    .select('id, naam, latitude, longitude')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null);

  let generated = 0;
  let skipped = 0;
  let errors = 0;

  for (const stad of steden || []) {
    try {
      const { data: existingRoute } = await supabase
        .from('routes')
        .select('id')
        .eq('nl_plaats_id', plaats.id)
        .eq('buitenland_stad_id', stad.id)
        .maybeSingle();

      if (existingRoute) {
        skipped++;
        continue;
      }

      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${depotLon},${depotLat};${plaats.longitude},${plaats.latitude};${stad.longitude},${stad.latitude};${depotLon},${depotLat}?overview=false`;
      const response = await fetch(osrmUrl);
      const data = await response.json();

      if (data.routes?.[0]) {
        const totalDistanceKm = Math.round(data.routes[0].distance / 1000);
        const prijs = Math.round(totalDistanceKm * kmTarief);

        const { error } = await supabase.from('routes').insert({
          nl_plaats_id: plaats.id,
          buitenland_stad_id: stad.id,
          afstand_km: totalDistanceKm,
          geschatte_prijs: prijs,
          slug: `${slugify(plaats.naam)}-naar-${slugify(stad.naam)}`,
        });

        if (error) {
          if (error.code === '23505') skipped++;
          else errors++;
        } else {
          generated++;
        }
      }

      await new Promise((r) => setTimeout(r, 100));
    } catch (error) {
      console.error(`Route fout voor ${plaats.naam} -> ${stad.naam}:`, error);
      errors++;
    }
  }

  return new Response(JSON.stringify({ success: true, generated, skipped, errors }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});