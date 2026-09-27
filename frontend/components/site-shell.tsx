import Link from "next/link";
import type { ReactNode } from "react";

import { type Locale, siteCopy } from "@/lib/site-content";

export const localPath = (locale: Locale, path = "") => `/${locale}${path}`;

export function ConsultationButton({ locale, source = "site" }: { locale: Locale; source?: string }) {
  return <Link className="button button-primary" href={`${localPath(locale, "/consultation")}?source=${source}`}>{siteCopy[locale].consultation}</Link>;
}

export function SiteShell({ locale, children }: { locale: Locale; children: ReactNode }) {
  const copy = siteCopy[locale];
  const alternateLocale: Locale = locale === "fa" ? "en" : "fa";
  return <div className="site" dir={locale === "fa" ? "rtl" : "ltr"} lang={locale}>
    <header className="site-header"><div className="shell header-inner">
      <Link className="brand" href={localPath(locale)} aria-label="Jahan Academy home"><span className="brand-mark" aria-hidden="true">⌑</span><span><strong>JAHAN</strong><small>ACADEMY · {copy.brandTagline}</small></span></Link>
      <nav className="main-nav" aria-label={locale === "fa" ? "ناوبری اصلی" : "Main navigation"}>{copy.nav.map((item) => <Link key={item.href} href={localPath(locale, item.href)}>{item.label}</Link>)}</nav>
      <div className="header-actions"><Link className="locale-link" href={localPath(alternateLocale)} lang={alternateLocale}>{alternateLocale.toUpperCase()}</Link><ConsultationButton locale={locale} source="header" /></div>
    </div></header>
    {children}
    <footer className="site-footer"><div className="shell footer-grid"><div><div className="footer-brand">JAHAN ACADEMY</div><p>{copy.footerText}</p></div><div className="footer-links"><Link href={localPath(locale, "/contact")}>{locale === "fa" ? "تماس با ما" : "Contact"}</Link><Link href={localPath(locale, "/faq")}>FAQ</Link><Link href={localPath(locale, "/privacy")}>{locale === "fa" ? "حریم خصوصی" : "Privacy"}</Link><Link href={localPath(locale, "/terms")}>{locale === "fa" ? "قوانین استفاده" : "Terms"}</Link></div></div></footer>
  </div>;
}
