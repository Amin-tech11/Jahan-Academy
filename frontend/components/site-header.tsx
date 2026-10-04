"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { ButtonLink } from "@/components/ui";
import { headerDestinations, type Locale, siteCopy } from "@/lib/site-content";

export function SiteHeader({ locale }: { locale: Locale }) {
  const copy = siteCopy[locale];
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const alternateLocale: Locale = locale === "fa" ? "en" : "fa";
  const alternatePath = pathname.replace(/^\/(fa|en)(?=\/|$)/, `/${alternateLocale}`);
  const consultationPath = `/${locale}/consultation?source=header`;
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  const links = (desktop: boolean) => copy.nav.map((item) => {
    const href = `/${locale}${item.href}`;
    const active = pathname === href || (item.href && pathname.startsWith(`${href}/`));
    if (item.href === "/countries") {
      const destinations = [...headerDestinations].sort((a, b) => a[locale].localeCompare(b[locale], locale));
      const options = <div className="nav-destinations-list" dir={locale === "fa" ? "rtl" : "ltr"}>
        <Link href={href} onClick={() => setOpen(false)}>{locale === "fa" ? "همه مقصدها" : "All destinations"}</Link>
        {destinations.map((destination) => <Link key={destination.slug} href={`/${locale}/countries/${destination.slug}`} onClick={() => setOpen(false)}><span className="nav-destination-flag" aria-hidden="true"><Image src={`/destinations/flags/${destination.slug}.svg`} alt="" width={28} height={28} /></span><span>{destination[locale]}</span></Link>)}
      </div>;
      if (desktop) return <div className="nav-destinations nav-destinations--desktop" key={href}>
        <Link className="nav-destinations-trigger" href={href} aria-current={active ? "page" : undefined}>{item.label}<svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="m2 4 4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg></Link>
        {options}
      </div>;
      return <details className="nav-destinations" key={href}>
        <summary aria-current={active ? "page" : undefined}>{item.label}</summary>
        {options}
      </details>;
    }
    return <Link key={href} href={href} aria-current={active ? "page" : undefined} onClick={() => setOpen(false)}>{item.label}</Link>;
  });

  return <header className="site-header"><div className="shell header-inner">
    <Link className="brand" href={`/${locale}`} aria-label={locale === "fa" ? "جهان آکادمی، صفحه اصلی" : "Jahan Academy, home"}>
      <span className="brand-image"><Image src="/brand/jahan-academy-official.png" alt="" fill sizes="(max-width: 600px) 180px, (max-width: 900px) 240px, 150px" preload /></span>
    </Link>
    <nav className="main-nav" aria-label={locale === "fa" ? "ناوبری اصلی" : "Main navigation"}>{links(true)}</nav>
    <div className="header-actions">
      <Link className="locale-link" href={alternatePath || `/${alternateLocale}`} lang={alternateLocale} hrefLang={alternateLocale} aria-label={locale === "fa" ? "English" : "فارسی"}>{alternateLocale.toUpperCase()}</Link>
      <ButtonLink size="sm" href={consultationPath}>{copy.consultation}</ButtonLink>
      <button className="mobile-menu-toggle" type="button" aria-label={locale === "fa" ? "باز کردن منو" : "Toggle menu"} aria-controls="mobile-navigation" aria-expanded={open} onClick={() => setOpen(!open)}><span aria-hidden="true">{open ? "×" : "☰"}</span></button>
    </div>
  </div><nav id="mobile-navigation" className="mobile-nav" data-open={open} aria-label={locale === "fa" ? "ناوبری موبایل" : "Mobile navigation"} inert={!open}>{links(false)}<ButtonLink href={consultationPath}>{copy.consultation}</ButtonLink></nav></header>;
}
