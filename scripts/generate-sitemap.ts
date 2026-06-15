// Generates static sitemap files at build/dev time.
// - public/sitemap.xml          -> sitemap index linking to per-domain sitemaps
// - public/sitemap-hoofdsite.xml -> deeuropakoerier.nl URLs
// - public/sitemap-<slug>.xml    -> per-country domain URLs
//
// Same dist is served on every domain, so the index lives at /sitemap.xml
// for every host; each sitemap entry uses absolute URLs on its own domain.

import { writeFileSync, mkdirSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://opiojltrlkpivowxfvrz.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9waW9qbHRybGtwaXZvd3hmdnJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzNDk1NjAsImV4cCI6MjA4MTkyNTU2MH0.Vl_wK21saBea6ggLpe2qklfwj-Uc0zJ_spYYoXxJDY8";

const MAIN_HOST = "www.deeuropakoerier.nl";

const COMMON_PATHS: Array<{ p: string; priority: string; changefreq: string }> = [
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

interface UrlEntry {
  loc: string;
  priority: string;
  changefreq: string;
  lastmod: string;
}

function xmlEscape(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderUrlset(entries: UrlEntry[]) {
  const seen = new Set<string>();
  const unique = entries.filter((u) => {
    if (seen.has(u.loc)) return false;
    seen.add(u.loc);
    return true;
  });
  const body = unique
    .map(
      (u) =>
        `  <url>\n    <loc>${xmlEscape(u.loc)}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

function renderIndex(locs: string[]) {
  const body = locs
    .map(
      (loc) =>
        `  <sitemap>\n    <loc>${xmlEscape(loc)}</loc>\n    <lastmod>${today}</lastmod>\n  </sitemap>`
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</sitemapindex>\n`;
}

const today = new Date().toISOString().split("T")[0];

function normalizeHost(domein: string | null | undefined): string | null {
  if (!domein) return null;
  const d = domein
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");
  if (!d) return null;
  return d.startsWith("www.") ? d : `www.${d}`;
}

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const { data: landen } = await supabase
    .from("landen")
    .select("id, slug, naam, domein, actief")
    .eq("actief", true);

  const { data: blogs } = await supabase
    .from("blog_artikelen")
    .select("slug, updated_at")
    .eq("gepubliceerd", true);

  const { data: steden } = await supabase
    .from("buitenland_steden")
    .select("id, slug, land_id");

  const { data: routes } = await supabase
    .from("routes")
    .select("slug, buitenland_stad_id");

  const stedenById = new Map<string, any>();
  (steden || []).forEach((s: any) => stedenById.set(s.id, s));

  mkdirSync(resolve("public"), { recursive: true });

  const sitemapLocs: string[] = [];

  // ----- Main / hoofdsite -----
  const mainBase = `https://${MAIN_HOST}`;
  const mainEntries: UrlEntry[] = COMMON_PATHS.map((s) => ({
    loc: `${mainBase}${s.p}`,
    priority: s.priority,
    changefreq: s.changefreq,
    lastmod: today,
  }));

  (blogs || []).forEach((b: any) => {
    mainEntries.push({
      loc: `${mainBase}/blog/${b.slug}`,
      priority: "0.6",
      changefreq: "monthly",
      lastmod: (b.updated_at || today).split("T")[0],
    });
  });

  (landen || []).forEach((l: any) => {
    mainEntries.push({
      loc: `${mainBase}/spoedkoerier-naar/${l.slug}`,
      priority: "0.9",
      changefreq: "weekly",
      lastmod: today,
    });
  });

  (steden || []).forEach((s: any) => {
    mainEntries.push({
      loc: `${mainBase}/bestemming/${s.slug}`,
      priority: "0.7",
      changefreq: "monthly",
      lastmod: today,
    });
  });

  const landenById = new Map<string, any>();
  (landen || []).forEach((l: any) => landenById.set(l.id, l));

  (routes || []).forEach((r: any) => {
    const stad = stedenById.get(r.buitenland_stad_id);
    if (!stad) return;
    const land = landenById.get(stad.land_id);
    if (!land) return;
    mainEntries.push({
      loc: `${mainBase}/spoed-koerier-${land.slug}/${r.slug}`,
      priority: "0.6",
      changefreq: "monthly",
      lastmod: today,
    });
  });

  writeFileSync(resolve("public/sitemap-hoofdsite.xml"), renderUrlset(mainEntries));
  sitemapLocs.push(`${mainBase}/sitemap-hoofdsite.xml`);

  // ----- Per country domain -----
  for (const l of landen || []) {
    const host = normalizeHost(l.domein);
    if (!host) continue;
    const base = `https://${host}`;
    const entries: UrlEntry[] = COMMON_PATHS.map((s) => ({
      loc: `${base}${s.p}`,
      priority: s.priority,
      changefreq: s.changefreq,
      lastmod: today,
    }));

    (blogs || []).forEach((b: any) => {
      entries.push({
        loc: `${base}/blog/${b.slug}`,
        priority: "0.6",
        changefreq: "monthly",
        lastmod: (b.updated_at || today).split("T")[0],
      });
    });

    const landSteden = (steden || []).filter((s: any) => s.land_id === l.id);
    landSteden.forEach((s: any) => {
      entries.push({
        loc: `${base}/bestemming/${s.slug}`,
        priority: "0.8",
        changefreq: "weekly",
        lastmod: today,
      });
    });

    const stedenIds = new Set(landSteden.map((s: any) => s.id));
    (routes || [])
      .filter((r: any) => stedenIds.has(r.buitenland_stad_id))
      .forEach((r: any) => {
        entries.push({
          loc: `${base}/spoed-koerier-${l.slug}/${r.slug}`,
          priority: "0.7",
          changefreq: "monthly",
          lastmod: today,
        });
      });

    writeFileSync(
      resolve(`public/sitemap-${l.slug}.xml`),
      renderUrlset(entries)
    );
    sitemapLocs.push(`${base}/sitemap-${l.slug}.xml`);
  }

  // ----- Index -----
  writeFileSync(resolve("public/sitemap.xml"), renderIndex(sitemapLocs));

  console.log(
    `Sitemap generated: ${sitemapLocs.length} sub-sitemaps, ${
      mainEntries.length
    } main urls.`
  );
}

main().catch((err) => {
  console.error("Sitemap generation failed:", err);
  process.exit(1);
});
