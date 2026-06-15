import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";
import { useAnalytics } from "./lib/analytics";
import Index from "./pages/Index";

import RouteDetailPage from "./pages/RouteDetailPage";
import BestemmingenPage from "./pages/BestemmingenPage";
import BestemmingDetailPage from "./pages/BestemmingDetailPage";
import LandPage from "./pages/LandPage";
import QuotePage from "./pages/QuotePage";
import OfferteStatusPage from "./pages/OfferteStatusPage";
import AccountLogin from "./pages/account/AccountLogin";
import AccountDashboard from "./pages/account/AccountDashboard";


import PrijsBerekenenPage from "./pages/PrijsBerekenenPage";
import PrijsIndicatiePage from "./pages/PrijsIndicatiePage";
import ContactPage from "./pages/ContactPage";
import FaqPage from "./pages/FaqPage";
import AlgemeneVoorwaardenPage from "./pages/AlgemeneVoorwaardenPage";
import PrivacybeleidPage from "./pages/PrivacybeleidPage";
import InternationaalTransportPage from "./pages/services/InternationaalTransportPage";
import KunsttransportPage from "./pages/services/KunsttransportPage";
import MedischTransportPage from "./pages/services/MedischTransportPage";
import OnBoardKoeriersdienstPage from "./pages/services/OnBoardKoeriersdienstPage";
import LaadcapaciteitPage from "./pages/LaadcapaciteitPage";
import CertificeringenPage from "./pages/CertificeringenPage";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminLanden from "./pages/admin/AdminLanden";
import AdminLandBranding from "./pages/admin/AdminLandBranding";
import AdminDomeinen from "./pages/admin/AdminDomeinen";
import AdminNlPlaatsen from "./pages/admin/AdminNlPlaatsen";
import AdminBuitenlandSteden from "./pages/admin/AdminBuitenlandSteden";
import AdminRoutes from "./pages/admin/AdminRoutes";
import AdminAanvragen from "./pages/admin/AdminAanvragen";
import AdminPrijsberekeningen from "./pages/admin/AdminPrijsberekeningen";
import AdminInstellingen from "./pages/admin/AdminInstellingen";
import AdminBlog from "./pages/admin/AdminBlog";
import AdminTerugbel from "./pages/admin/AdminTerugbel";
import AdminSeo from "./pages/admin/AdminSeo";
import BlogIndexPage from "./pages/BlogIndexPage";
import BlogDetailPage from "./pages/BlogDetailPage";
import { FloatingActions } from "./components/public/FloatingActions";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AnalyticsTracker = () => {
  useAnalytics();
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AnalyticsTracker />
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/routes" element={<Navigate to="/bestemmingen" replace />} />
          <Route path="/route/:slug" element={<RouteDetailPage />} />
          <Route path="/:landPrefix/:slug" element={<RouteDetailPage />} />
          <Route path="/bestemmingen" element={<BestemmingenPage />} />
          <Route path="/bestemming/:slug" element={<BestemmingDetailPage />} />
          <Route path="/spoedkoerier-naar/:landSlug" element={<LandPage />} />
          <Route path="/offerte" element={<QuotePage />} />
          <Route path="/offerte-status/:token" element={<OfferteStatusPage />} />
          <Route path="/account/login" element={<AccountLogin />} />
          <Route path="/account" element={<AccountDashboard />} />

          <Route path="/prijs-berekenen" element={<PrijsIndicatiePage />} />
          <Route path="/prijs-indicatie" element={<PrijsIndicatiePage />} />
          <Route path="/offerte-aanvragen" element={<PrijsBerekenenPage />} />
          <Route path="/offerte-aanvragen" element={<PrijsBerekenenPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/algemene-voorwaarden" element={<AlgemeneVoorwaardenPage />} />
          <Route path="/privacybeleid" element={<PrivacybeleidPage />} />
          <Route path="/internationaal-transport" element={<InternationaalTransportPage />} />
          <Route path="/kunsttransport" element={<KunsttransportPage />} />
          <Route path="/medisch-transport" element={<MedischTransportPage />} />
          <Route path="/on-board-koeriersdienst" element={<OnBoardKoeriersdienstPage />} />
          <Route path="/laadcapaciteit" element={<LaadcapaciteitPage />} />
          <Route path="/certificeringen" element={<CertificeringenPage />} />
          <Route path="/auth" element={<Navigate to="/admin/login" replace />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/landen" element={<AdminLanden />} />
          <Route path="/admin/landen/:id/branding" element={<AdminLandBranding />} />
          <Route path="/admin/domeinen" element={<AdminDomeinen />} />
          <Route path="/admin/nl-plaatsen" element={<AdminNlPlaatsen />} />
          <Route path="/admin/buitenland-steden" element={<AdminBuitenlandSteden />} />
          <Route path="/admin/routes" element={<AdminRoutes />} />
          <Route path="/admin/aanvragen" element={<AdminAanvragen />} />
          <Route path="/admin/prijsberekeningen" element={<AdminPrijsberekeningen />} />
          <Route path="/admin/instellingen" element={<AdminInstellingen />} />
          <Route path="/admin/blog" element={<AdminBlog />} />
          <Route path="/admin/terugbel" element={<AdminTerugbel />} />
          <Route path="/admin/seo" element={<AdminSeo />} />
          <Route path="/blog" element={<BlogIndexPage />} />
          <Route path="/blog/:slug" element={<BlogDetailPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <FloatingActions />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;