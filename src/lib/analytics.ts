import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const GA_ID = 'G-0GWRMY8HYK';

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

export function useAnalytics() {
  const location = useLocation();

  useEffect(() => {
    if (typeof window === 'undefined' || !window.gtag) return;

    const pagePath = location.pathname + location.search;
    const pageTitle = document.title;

    window.gtag('event', 'page_view', {
      page_path: pagePath,
      page_title: pageTitle,
      page_location: window.location.href,
      send_to: GA_ID,
    });
  }, [location.pathname, location.search]);
}

export function trackEvent(
  eventName: string,
  eventParams?: Record<string, any>
) {
  if (typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', eventName, {
    send_to: GA_ID,
    ...eventParams,
  });
}
