import Link from "next/link";
import type { ReactNode } from "react";

import { SiteHeader } from "@/components/site-header";
import { FloatingConsultation } from "@/components/floating-consultation";
import { ButtonLink } from "@/components/ui";
import { type Locale, siteCopy } from "@/lib/site-content";

export const localPath = (locale: Locale, path = "") => `/${locale}${path}`;

export function ConsultationButton({ locale, source = "site" }: { locale: Locale; source?: string }) {
  return <ButtonLink href={`${localPath(locale, "/consultation")}?source=${encodeURIComponent(source)}`}>{siteCopy[locale].consultation}</ButtonLink>;
}

export function SiteShell({ locale, children, className }: { locale: Locale; children: ReactNode; className?: string }) {
  const copy = siteCopy[locale];
  return <div className={className ? `site ${className}` : "site"} dir={locale === "fa" ? "rtl" : "ltr"} lang={locale}>
    <SiteHeader locale={locale} />
    {children}
    <footer className="site-footer"><div className="shell footer-grid"><div><div className="footer-brand">JAHAN ACADEMY</div><p>{copy.footerText}</p></div><nav className="footer-links" aria-label={locale === "fa" ? "پیوندهای پایین صفحه" : "Footer links"}><Link href={localPath(locale, "/contact")}>{locale === "fa" ? "تماس با ما" : "Contact"}</Link><Link href={localPath(locale, "/faq")}>FAQ</Link><Link href={localPath(locale, "/privacy")}>{locale === "fa" ? "حریم خصوصی" : "Privacy"}</Link><Link href={localPath(locale, "/terms")}>{locale === "fa" ? "قوانین استفاده" : "Terms"}</Link></nav></div><div className="shell footer-bottom">© {new Date().getUTCFullYear()} Jahan Academy</div></footer>
    <FloatingConsultation locale={locale} />
  </div>;
}
