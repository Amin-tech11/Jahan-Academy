import type { ReactNode } from "react";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FloatingConsultation } from "@/components/floating-consultation";
import { ButtonLink } from "@/components/ui";
import { type Locale, siteCopy } from "@/lib/site-content";

export const localPath = (locale: Locale, path = "") => `/${locale}${path}`;

export function ConsultationButton({ locale, source = "site" }: { locale: Locale; source?: string }) {
  return <ButtonLink href={`${localPath(locale, "/consultation")}?source=${encodeURIComponent(source)}`}>{siteCopy[locale].consultation}</ButtonLink>;
}

export function SiteShell({ locale, children, className }: { locale: Locale; children: ReactNode; className?: string }) {
  return <div className={className ? `site ${className}` : "site"} dir={locale === "fa" ? "rtl" : "ltr"} lang={locale}>
    <SiteHeader locale={locale} />
    {children}
    <SiteFooter locale={locale} />
    <FloatingConsultation locale={locale} />
  </div>;
}
