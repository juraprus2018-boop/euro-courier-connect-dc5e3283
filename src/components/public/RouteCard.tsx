import { Link } from 'react-router-dom';
import { MapPin, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface RouteCardProps {
  nlPlaats: string;
  buitenlandStad: string;
  afstandKm: number;
  prijs: number;
  slug: string;
  landSlug?: string;
}

export function RouteCard({ nlPlaats, buitenlandStad, afstandKm, prijs, slug, landSlug }: RouteCardProps) {
  const to = landSlug ? `/spoed-koerier-${landSlug}/${slug}` : `/route/${slug}`;
  return (
    <Link to={to}>
      <Card className="group hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-1">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="font-medium text-foreground">{nlPlaats}</span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 text-accent" />
                <span className="font-medium text-foreground">{buitenlandStad}</span>
              </div>
            </div>
            
            <div className="text-right">
              <ArrowRight className="h-5 w-5 text-primary group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}