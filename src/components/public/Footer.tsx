import { Link } from 'react-router-dom';
import { Truck, Mail, Phone, MapPin, FileText } from 'lucide-react';
import { CONTACT } from '@/lib/contact';
import niwoLogo from '@/assets/niwo-eurovergunning.png';
import citan from '@/assets/citan.png';
import bestelbus from '@/assets/bestelbus.webp';
import bakwagen from '@/assets/bakwagen.webp';

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container py-12">
        <div className="pb-10 mb-10 border-b border-border">
          <h4 className="font-display font-semibold text-center mb-6">Ons wagenpark</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { src: citan, alt: 'Bestelwagen van De Europa Koerier', label: 'Bestelwagen' },
              { src: bestelbus, alt: 'Bestelbus XL van De Europa Koerier', label: 'Bestelbus (XL)' },
              { src: bakwagen, alt: 'Bakwagen met laadklep van De Europa Koerier', label: 'Bakwagen met laadklep' },
            ].map((v) => (
              <Link key={v.label} to="/laadcapaciteit" className="group block text-center">
                <div className="bg-muted rounded-lg p-4 mb-2 flex items-center justify-center h-32 overflow-hidden">
                  <img src={v.src} alt={v.alt} loading="lazy" className="max-h-full w-auto object-contain transition-transform group-hover:scale-105" />
                </div>
                <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">{v.label}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Kolom 1: Logo + adres + contact */}
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary">
                <Truck className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-display text-lg font-bold">De Europa Koerier</span>
            </div>

            <address className="not-italic text-sm text-muted-foreground leading-relaxed">
              {CONTACT.adres}<br />
              {CONTACT.postcode} {CONTACT.plaats}<br />
              Nederland
            </address>

            <div className="space-y-2 text-sm">
              <a href={CONTACT.emailHref} className="block text-muted-foreground hover:text-foreground transition-colors break-all">
                {CONTACT.email}
              </a>
              <a href={CONTACT.telefoonHref} className="block text-muted-foreground hover:text-foreground transition-colors">
                {CONTACT.telefoon}
              </a>
            </div>

            <div className="pt-2">
              <img
                src={niwoLogo}
                alt="NIWO Eurovergunning - erkend transporteur"
                width={96}
                height={96}
                loading="lazy"
                className="h-20 w-20 object-contain"
              />
            </div>
          </div>

          {/* Kolom 2: Belangrijke links */}
          <div className="space-y-4">
            <h4 className="font-display text-lg font-bold">Belangrijke links</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link to="/bestemmingen" className="hover:text-foreground transition-colors">Alle bestemmingen</Link></li>
              <li><Link to="/offerte" className="hover:text-foreground transition-colors">Offerte aanvragen</Link></li>
              <li><Link to="/prijs-berekenen" className="hover:text-foreground transition-colors">Prijs berekenen</Link></li>
              <li><Link to="/laadcapaciteit" className="hover:text-foreground transition-colors">Laadcapaciteit</Link></li>
              <li><Link to="/faq" className="hover:text-foreground transition-colors">Veelgestelde vragen</Link></li>
              <li><Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Kolom 3: Diensten */}
          <div className="space-y-4">
            <h4 className="font-display text-lg font-bold">Diensten</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link to="/internationaal-transport" className="hover:text-foreground transition-colors">Internationaal transport</Link></li>
              <li><Link to="/kunsttransport" className="hover:text-foreground transition-colors">Kunsttransport</Link></li>
              <li><Link to="/medisch-transport" className="hover:text-foreground transition-colors">Medisch transport</Link></li>
              <li><Link to="/on-board-koeriersdienst" className="hover:text-foreground transition-colors">On-Board Koeriersdienst</Link></li>
              <li><Link to="/certificeringen" className="hover:text-foreground transition-colors">Certificeringen</Link></li>
            </ul>
          </div>

          {/* Kolom 4: Bedrijf */}
          <div className="space-y-4">
            <h4 className="font-display text-lg font-bold">De Europa Koerier</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link to="/" className="hover:text-foreground transition-colors">Home</Link></li>
              <li><Link to="/algemene-voorwaarden" className="hover:text-foreground transition-colors">Algemene voorwaarden</Link></li>
              <li><Link to="/privacybeleid" className="hover:text-foreground transition-colors">Privacybeleid</Link></li>
              <li>
                <a href="/documents/avc.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-foreground transition-colors">
                  <FileText className="h-4 w-4" /> AVC voorwaarden (PDF)
                </a>
              </li>
              <li>
                <a href="/documents/cmr.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-foreground transition-colors">
                  <FileText className="h-4 w-4" /> CMR verdrag (PDF)
                </a>
              </li>
            </ul>

            <div className="pt-2 text-xs text-muted-foreground space-y-1">
              <p>Openingstijden: Ma–Vr 08:00–18:00 · Za 09:00–14:00</p>
              <p>BTW: {CONTACT.btw} · KvK: {CONTACT.kvk}</p>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-border text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} {CONTACT.bedrijf}. Alle rechten voorbehouden.</p>
        </div>

        <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} {CONTACT.bedrijf}. Alle rechten voorbehouden.</p>
        </div>
      </div>
    </footer>
  );
}
