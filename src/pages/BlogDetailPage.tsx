import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SEOHead } from '@/components/SEOHead';
import { Header } from '@/components/public/Header';
import { Footer } from '@/components/public/Footer';
import { PageBreadcrumb } from '@/components/public/PageBreadcrumb';
import { Loader2, Calendar, ArrowLeft } from 'lucide-react';
import { useLand } from '@/hooks/useLand';
import { LandThemeProvider } from '@/components/LandThemeProvider';

// Eenvoudige markdown -> HTML converter (veilige subset)
function renderMarkdown(md: string): string {
  const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const lines = md.split('\n');
  const out: string[] = [];
  let inList = false;
  let inPara = false;
  const closePara = () => { if (inPara) { out.push('</p>'); inPara = false; } };
  const closeList = () => { if (inList) { out.push('</ul>'); inList = false; } };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { closePara(); closeList(); continue; }
    if (line.startsWith('### ')) { closePara(); closeList(); out.push(`<h3>${escape(line.slice(4))}</h3>`); continue; }
    if (line.startsWith('## ')) { closePara(); closeList(); out.push(`<h2>${escape(line.slice(3))}</h2>`); continue; }
    if (line.startsWith('# ')) { closePara(); closeList(); out.push(`<h2>${escape(line.slice(2))}</h2>`); continue; }
    if (line.startsWith('- ') || line.startsWith('* ')) {
      closePara();
      if (!inList) { out.push('<ul>'); inList = true; }
      out.push(`<li>${formatInline(escape(line.slice(2)))}</li>`);
      continue;
    }
    closeList();
    if (!inPara) { out.push('<p>'); inPara = true; } else { out.push(' '); }
    out.push(formatInline(escape(line)));
  }
  closePara(); closeList();
  return out.join('');
}

function formatInline(s: string) {
  return s
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary hover:underline">$1</a>');
}

const BlogDetailPage = () => {
  const { slug } = useParams();
  const { land } = useLand();

  const { data: artikel, isLoading } = useQuery({
    queryKey: ['blog-artikel', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_artikelen')
        .select('*')
        .eq('slug', slug!)
        .eq('gepubliceerd', true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  const content = (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title={artikel?.meta_title || artikel?.titel || 'Artikel'}
        description={artikel?.meta_description || artikel?.excerpt || undefined}
      />
      <Header landNaam={land?.naam} />
      <main className="flex-1 py-12">
        <div className="container">
          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : !artikel ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground mb-4">Artikel niet gevonden.</p>
              <Link to="/blog" className="text-primary hover:underline">← Terug naar blog</Link>
            </div>
          ) : (
            <article>
              <PageBreadcrumb items={[{ label: 'Blog', href: '/blog' }, { label: artikel.titel }]} />
              <Link to="/blog" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
                <ArrowLeft className="h-4 w-4" /> Terug naar overzicht
              </Link>

              <header className="mb-8">
                <h1 className="font-display text-4xl font-bold leading-tight">{artikel.titel}</h1>
                {artikel.gepubliceerd_op && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {new Date(artikel.gepubliceerd_op).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                )}
              </header>

              {artikel.cover_afbeelding_url && (
                <img src={artikel.cover_afbeelding_url} alt={artikel.titel} className="w-full rounded-2xl mb-8 aspect-video object-cover" />
              )}

              <div
                className="prose prose-lg max-w-none prose-headings:font-display prose-headings:font-bold prose-h2:text-2xl prose-h3:text-xl prose-a:text-primary"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(artikel.inhoud || '') }}
              />
            </article>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );

  return land ? <LandThemeProvider>{content}</LandThemeProvider> : content;
};

export default BlogDetailPage;
