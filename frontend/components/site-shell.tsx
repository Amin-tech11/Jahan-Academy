import type { ReactNode } from "react";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FloatingConsultation } from "@/components/floating-consultation";
import { GoogleAnalytics } from "@/components/google-analytics";
import { ButtonLink } from "@/components/ui";
import { type Locale, siteCopy } from "@/lib/site-content";
import { organizationSchema } from "@/lib/site-seo";

export const localPath = (locale: Locale, path = "") => `/${locale}${path}`;

export function ConsultationButton({ locale, source = "site" }: { locale: Locale; source?: string }) {
  return <ButtonLink href={`${localPath(locale, "/consultation")}?source=${encodeURIComponent(source)}`}>{siteCopy[locale].consultation}</ButtonLink>;
}

export function SiteShell({ locale, children, className }: { locale: Locale; children: ReactNode; className?: string }) {
  return <div className={className ? `site ${className}` : "site"} dir={locale === "fa" ? "rtl" : "ltr"} lang={locale}>
    <a className="skip-link" href="#main-content">{locale === "fa" ? "رفتن به محتوای اصلی" : "Skip to main content"}</a>
    <SiteHeader locale={locale} />
    <div id="main-content" tabIndex={-1}>{children}</div>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema()).replaceAll("<", "\\u003c") }} />
    <SiteFooter locale={locale} />
    <FloatingConsultation locale={locale} />
    <GoogleAnalytics />
  </div>;
}
