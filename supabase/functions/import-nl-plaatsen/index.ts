import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const slugify = (text: string) =>
  text.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

// Fallback list (top 10) als Overpass faalt
const fallbackTop10 = [
  { naam: "Amsterdam", lat: 52.3676, lon: 4.9041 },
  { naam: "Rotterdam", lat: 51.9225, lon: 4.4792 },
  { naam: "Den Haag", lat: 52.0705, lon: 4.3007 },
  { naam: "Utrecht", lat: 52.0907, lon: 5.1214 },
  { naam: "Eindhoven", lat: 51.4416, lon: 5.4697 },
  { naam: "Groningen", lat: 53.2194, lon: 6.5665 },
  { naam: "Tilburg", lat: 51.5555, lon: 5.0913 },
  { naam: "Almere", lat: 52.3508, lon: 5.2647 },
  { naam: "Breda", lat: 51.5719, lon: 4.7683 },
  { naam: "Nijmegen", lat: 51.8126, lon: 5.8372 },
];

async function fetchTopCitiesNL(limit = 100): Promise<{ naam: string; lat: number; lon: number }[]> {
  const query = `
[out:json][timeout:60];
area["ISO3166-1"="NL"][admin_level=2]->.nl;
(
  node["place"~"^(city|town)$"]["population"](area.nl);
);
out body;
`;
  const endpoints = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'data=' + encodeURIComponent(query),
      });
      if (!res.ok) continue;
      const data = await res.json();
      const items = (data.elements || [])
        .map((el: any) => ({
          naam: el.tags?.name || el.tags?.['name:nl'],
          lat: el.lat,
          lon: el.lon,
          pop: parseInt(el.tags?.population || '0', 10) || 0,
        }))
        .filter((c: any) => c.naam && c.lat && c.lon)
        .sort((a: any, b: any) => b.pop - a.pop);

      // dedupe by name (case-insensitive)
      const seen = new Set<string>();
      const unique: { naam: string; lat: number; lon: number }[] = [];
      for (const c of items) {
        const key = c.naam.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        unique.push({ naam: c.naam, lat: c.lat, lon: c.lon });
        if (unique.length >= limit) break;
      }
      if (unique.length > 0) return unique;
    } catch (e) {
      console.error('Overpass fetch failed:', e);
    }
  }
  return fallbackTop10;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  console.log('Starting NL places import - fetching top 100 via Overpass...');

  try {
    const cities = await fetchTopCitiesNL(100);
    console.log(`Fetched ${cities.length} NL cities`);

    // Clear existing
    const { error: deleteError } = await supabase
      .from('nl_plaatsen')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    if (deleteError) throw new Error(`Fout bij legen plaatsen: ${deleteError.message}`);

    const plaatsenToInsert = cities.map(stad => ({
      naam: stad.naam,
      slug: slugify(stad.naam),
      latitude: stad.lat,
      longitude: stad.lon,
    }));

    const { error: insertError } = await supabase
      .from('nl_plaatsen')
      .upsert(plaatsenToInsert, { onConflict: 'slug', ignoreDuplicates: false });
    if (insertError) throw new Error(`Fout bij importeren: ${insertError.message}`);

    console.log(`Import complete: ${plaatsenToInsert.length} cities imported`);

    return new Response(JSON.stringify({
      success: true,
      imported: plaatsenToInsert.length,
      cleared: true,
      cities: plaatsenToInsert.map(p => p.naam),
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Import error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
