"use client";

import Script from "next/script";
import { useCspNonce } from "./csp-nonce";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { GA_MEASUREMENT_ID, analyticsHostAllowed, analyticsPageLocation, analyticsReferrer } from "@/lib/google-analytics";

type AnalyticsWindow = Window & {
  dataLayer?: IArguments[];
  gtag?: (...args: unknown[]) => void;
  jahanAnalytics?: { lastPage: string | null };
};

function recordPage(pathname: string) {
  const target = window as AnalyticsWindow;
  const location = analyticsPageLocation(pathname);
  if (!location || !target.gtag || !target.jahanAnalytics || target.jahanAnalytics.lastPage === location) return;
  const referrer = target.jahanAnalytics.lastPage ?? analyticsReferrer(document.referrer);
  target.gtag("set", { page_location: location, page_referrer: referrer });
  target.gtag("event", "page_view", {
    send_to: GA_MEASUREMENT_ID,
    page_location: location,
    page_referrer: referrer,
    page_title: document.title,
  });
  target.jahanAnalytics.lastPage = location;
}

export function GoogleAnalytics() {
  const nonce = useCspNonce();
  const pathname = usePathname();
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    setEnabled(analyticsHostAllowed(window.location.hostname));
  }, []);
  useEffect(() => {
    if (enabled) recordPage(pathname);
  }, [enabled, pathname]);

  if (!enabled || !analyticsPageLocation(pathname)) return null;
  return <Script nonce={nonce} id="jahan-google-analytics" src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} strategy="afterInteractive" onReady={() => {
    const target = window as AnalyticsWindow;
    if (!target.jahanAnalytics) {
      target.dataLayer ??= [];
      // gtag uses an arguments queue so commands issued before its bootstrap are retained.
      target.gtag = function () { target.dataLayer!.push(arguments); };
      target.jahanAnalytics = { lastPage: null };
      target.gtag("js", new Date());
      target.gtag("config", GA_MEASUREMENT_ID, {
        send_page_view: false,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
        page_location: analyticsPageLocation(pathname),
        page_referrer: analyticsReferrer(document.referrer),
      });
    }
    recordPage(pathname);
  }} />;
}
