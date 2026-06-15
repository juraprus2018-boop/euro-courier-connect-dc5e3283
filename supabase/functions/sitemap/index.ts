import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface UrlEntry {
  loc: string;
  priority: string;
  changefreq: string;
  lastmod?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const hostParam = url.searchParams.get("host");
    const forwardedHost =
      req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
    const host = (hostParam || forwardedHost).toLowerCase().replace(/^www\./, "");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: landen } = await supabase
      .from("landen")
      .select("*")
      .eq("actief", true);

    const land = landen?.find((l: any) => {
      if (!l.domein) return false;
      const d = l.domein
        .toLowerCase()
        .replace(/^https?:\/\//, "")
        .replace(/^www\./, "")
        .replace(/\/$/, "");
      return host === d || host.endsWith("." + d);
    });

    const isHoofdsite = !land;
    const baseHost = host || (isHoofdsite ? "deeuropakoerier.nl" : "deeuropakoerier.nl");
    const baseUrl = `https://www.${baseHost.replace(/^www\./, "")}`;
    const today = new Date().toISOString().split("T")[0];

    const urls: UrlEntry[] = [];

    // Common public pages (op alle sites)
    const commonPaths: Array<{ p: string; priority: string; changefreq: string }> = [
      { p: "/", priority: "1.0", changefreq: "daily" },
      { p: "/bestemmingen", priority: "0.9", changefreq: "weekly" },
      { p: "/offerte", priority: "0.8", changefreq: "monthly" },
      { p: "/offerte-aanvragen", priority: "0.7", changefreq: "monthly" },
      { p: "/prijs-berekenen", priority: "0.8", changefreq: "monthly" },
      { p: "/prijs-indicatie", priority: "0.6", changefreq: "monthly" },
      { p: "/contact", priority: "0.7", changefreq: "monthly" },
      { p: "/faq", priority: "0.6", changefreq: "monthly" },
      { p: "/laadcapaciteit", priority: "0.6", changefreq: "monthly" },
      { p: "/certificeringen", priority: "0.5", changefreq: "yearly" },
      { p: "/internationaal-transport", priority: "0.7", changefreq: "monthly" },
      { p: "/kunsttransport", priority: "0.7", changefreq: "monthly" },
      { p: "/medisch-transport", priority: "0.7", changefreq: "monthly" },
      { p: "/on-board-koeriersdienst", priority: "0.7", changefreq: "monthly" },
      { p: "/blog", priority: "0.6", changefreq: "weekly" },
      { p: "/algemene-voorwaarden", priority: "0.2", changefreq: "yearly" },
      { p: "/privacybeleid", priority: "0.2", changefreq: "yearly" },
    ];
    for (const s of commonPaths) {
      urls.push({
        loc: `${baseUrl}${s.p}`,
        priority: s.priority,
        changefreq: s.changefreq,
        lastmod: today,
      });
    }

    // Blog artikelen (gepubliceerd)
    const { data: blogs } = await supabase
      .from("blog_artikelen")
      .select("slug, updated_at, gepubliceerd")
      .eq("gepubliceerd", true);
    blogs?.forEach((b: any) => {
      urls.push({
        loc: `${baseUrl}/blog/${b.slug}`,
        priority: "0.6",
        changefreq: "monthly",
        lastmod: (b.updated_at || today).split("T")[0],
      });
    });

    if (isHoofdsite) {
      // Hoofdsite: alle landen-overzichtspagina's + alle bestemmingen + alle routes
      landen?.forEach((l: any) => {
        urls.push({
          loc: `${baseUrl}/spoedkoerier-naar/${l.slug}`,
          priority: "0.9",
          changefreq: "weekly",
          lastmod: today,
        });
      });

      const { data: steden } = await supabase
        .from("buitenland_steden")
        .select("slug")
        .limit(2000);
      steden?.forEach((s: any) => {
        urls.push({
          loc: `${baseUrl}/bestemming/${s.slug}`,
          priority: "0.7",
          changefreq: "monthly",
          lastmod: today,
        });
      });

      const { data: routes } = await supabase
        .from("routes")
        .select("slug, buitenland_stad:buitenland_steden(land:landen(slug, actief))")
        .limit(5000);
      routes?.forEach((r: any) => {
        const landSlug = r.buitenland_stad?.land?.slug;
        const actief = r.buitenland_stad?.land?.actief;
        if (!landSlug || !actief) return;
        urls.push({
          loc: `${baseUrl}/spoed-koerier-${landSlug}/${r.slug}`,
          priority: "0.6",
          changefreq: "monthly",
          lastmod: today,
        });
      });
    } else if (land) {
      // Land-specifieke site: alleen bestemmingen + routes voor dit land
      const { data: steden } = await supabase
        .from("buitenland_steden")
        .select("slug, id")
        .eq("land_id", land.id);

      steden?.forEach((s: any) => {
        urls.push({
          loc: `${baseUrl}/bestemming/${s.slug}`,
          priority: "0.8",
          changefreq: "weekly",
          lastmod: today,
        });
      });

      if (steden && steden.length > 0) {
        const { data: routes } = await supabase
          .from("routes")
          .select("slug")
          .in("buitenland_stad_id", steden.map((s: any) => s.id));
        routes?.forEach((r: any) => {
          urls.push({
            loc: `${baseUrl}/spoed-koerier-${land.slug}/${r.slug}`,
            priority: "0.7",
            changefreq: "monthly",
            lastmod: today,
          });
        });
      }
    }

    // De-duplicate by loc
    const seen = new Set<string>();
    const unique = urls.filter((u) => {
      if (seen.has(u.loc)) return false;
      seen.add(u.loc);
      return true;
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${unique
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod || today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    console.error("Sitemap error:", err);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`,
      {
        headers: { ...corsHeaders, "Content-Type": "application/xml" },
      }
    );
  }
});
