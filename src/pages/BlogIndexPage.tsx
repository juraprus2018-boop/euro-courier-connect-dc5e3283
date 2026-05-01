import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SEOHead } from '@/components/SEOHead';
import { Header } from '@/components/public/Header';
import { Footer } from '@/components/public/Footer';
import { PageBreadcrumb } from '@/components/public/PageBreadcrumb';
import { Loader2, Calendar, ArrowRight } from 'lucide-react';
import { useLand } from '@/hooks/useLand';
import { LandThemeProvider } from '@/components/LandThemeProvider';

const BlogIndexPage = () => {
  const { land } = useLand();

  const { data: artikelen, isLoading } = useQuery({
    queryKey: ['blog-artikelen', land?.id || 'main'],
    queryFn: async () => {
      let query = supabase
        .from('blog_artikelen')
        .select('id, titel, slug, excerpt, cover_afbeelding_url, gepubliceerd_op')
        .eq('gepubliceerd', true)
        .order('gepubliceerd_op', { ascending: false });
      // Hoofdsite toont alle algemene artikelen (land_id IS NULL),
      // landdomein toont land-specifieke + algemene
      if (land) {
        query = query.or(`land_id.eq.${land.id},land_id.is.null`);
      } else {
        query = query.is('land_id', null);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const content = (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title={`Spoedkoerier kennisbank & blog${land ? ` | ${land.naam}` : ''}`}
        description="Praktische tips, prijsinformatie en veelgestelde vragen over spoedkoeriersdiensten door Europa."
      />
      <Header landNaam={land?.naam} />
      <main className="flex-1 py-12">
        <div className="container">
          <PageBreadcrumb items={[{ label: 'Blog & kennisbank' }]} />
          <header className="mb-10">
            <h1 className="font-display text-4xl font-bold">Spoedkoerier kennisbank</h1>
            <p className="mt-3 text-muted-foreground max-w-2xl">
              Antwoorden op veelgestelde vragen, prijsuitleg, transporttips en achtergronden over koeriersdiensten in Europa.
            </p>
          </header>

          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : artikelen && artikelen.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {artikelen.map((art) => (
                <Link
                  key={art.id}
                  to={`/blog/${art.slug}`}
                  className="group rounded-2xl border border-border bg-card overflow-hidden hover:border-primary hover:shadow-lg transition-all flex flex-col"
                >
                  {art.cover_afbeelding_url ? (
                    <div className="aspect-video bg-muted overflow-hidden">
                      <img src={art.cover_afbeelding_url} alt={art.titel} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                  ) : (
                    <div className="aspect-video bg-gradient-to-br from-primary/10 to-primary/30" />
                  )}
                  <div className="p-5 flex-1 flex flex-col">
                    {art.gepubliceerd_op && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                        <Calendar className="h-3 w-3" />
                        {new Date(art.gepubliceerd_op).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                    )}
                    <h2 className="font-display font-semibold text-lg leading-snug group-hover:text-primary transition-colors">
                      {art.titel}
                    </h2>
                    {art.excerpt && (
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{art.excerpt}</p>
                    )}
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                      Lees verder <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              Er zijn nog geen artikelen gepubliceerd.
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );

  return land ? <LandThemeProvider>{content}</LandThemeProvider> : content;
};

export default BlogIndexPage;
