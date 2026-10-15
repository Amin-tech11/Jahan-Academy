"use client";

import Link from "next/link";
import { PreparedImage as Image } from "@/components/prepared-image";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import "./site-header-mobile.css";
import { captureLocaleScroll, restoreLocaleScroll, type LocaleScrollPosition } from "@/lib/locale-scroll";

import { ButtonLink } from "@/components/ui";
import { headerDestinations, type Locale, siteCopy } from "@/lib/site-content";

let pendingLocaleScroll: LocaleScrollPosition | undefined;

export function SiteHeader({ locale }: { locale: Locale }) {
  const copy = siteCopy[locale];
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLDialogElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const alternateLocale: Locale = locale === "fa" ? "en" : "fa";
  const alternatePath = pathname.replace(/^\/(fa|en)(?=\/|$)/, `/${alternateLocale}`);
  const consultationPath = `/${locale}/consultation?source=header`;
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const measure = () => document.documentElement.style.setProperty("--site-header-height", `${header.getBoundingClientRect().height}px`);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);
  useLayoutEffect(() => {
    const position = pendingLocaleScroll;
    if (!position || position.path !== pathname) return;
    pendingLocaleScroll = undefined;
    restoreLocaleScroll(position);
    // Account for deferred image/font layout without overriding user scrolling.
    const main = document.querySelector("main");
    const observer = new ResizeObserver(() => restoreLocaleScroll(position));
    if (main) observer.observe(main);
    // Route commit and browser focus restoration may run after layout effects.
    const settle = window.setInterval(() => restoreLocaleScroll(position), 50);
    const stop = () => { observer.disconnect(); window.clearInterval(settle); };
    const timeout = window.setTimeout(stop, 2000);
    const events = ["wheel", "touchstart", "pointerdown", "keydown"] as const;
    events.forEach(event => window.addEventListener(event, stop, { passive: true, once: true }));
    return () => {
      stop();
      window.clearTimeout(timeout);
      events.forEach(event => window.removeEventListener(event, stop));
    };
  }, [pathname]);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const menu = menuRef.current;
    const root = document.documentElement;
    const media = window.matchMedia("(max-width: 1199px)");
    if (!menu || !media.matches) { setOpen(false); return; }
    const previousOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    root.dataset.mobileMenuOpen = "true";
    menu.showModal();
    closeRef.current?.focus({ preventScroll: true });
    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const controls = [...menu.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), summary, [tabindex="0"]')]
        .filter(element => element.getClientRects().length > 0);
      const first = controls[0];
      const last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault(); last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first?.focus();
      }
    };
    menu.addEventListener("keydown", trapFocus);
    const resize = () => { if (!media.matches) setOpen(false); };
    media.addEventListener("change", resize);
    return () => {
      menu.close();
      menu.removeEventListener("keydown", trapFocus);
      delete root.dataset.mobileMenuOpen;
      root.style.overflow = previousOverflow;
      media.removeEventListener("change", resize);
      toggleRef.current?.focus({ preventScroll: true });
    };
  }, [open]);

  const links = (desktop: boolean) => copy.nav.map((item) => {
    const href = `/${locale}${item.href}`;
    const active = pathname === href || (item.href && pathname.startsWith(`${href}/`));
    if (item.href === "/countries") {
      const destinations = [...headerDestinations].sort((a, b) => a[locale].localeCompare(b[locale], locale));
      const options = <div className="nav-destinations-list" dir={locale === "fa" ? "rtl" : "ltr"}>
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

  return <header ref={headerRef} className="site-header"><div className="shell header-inner">
    <Link className="brand" href={`/${locale}`} aria-label={locale === "fa" ? "جهان آکادمی، صفحه اصلی" : "Jahan Academy, home"}>
      <span className="brand-image"><Image src="/brand/jahan-academy-official.png" alt="" fill sizes="(max-width: 600px) 180px, (max-width: 900px) 240px, 150px" preload /></span>
    </Link>
    <nav className="main-nav" aria-label={locale === "fa" ? "ناوبری اصلی" : "Main navigation"}>{links(true)}</nav>
    <div className="header-actions">
      <div className="language-switch" role="group" aria-label={locale === "fa" ? "انتخاب زبان سایت" : "Website language"} dir="ltr">
        <svg className="language-switch__icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="9" /><ellipse cx="12" cy="12" rx="4" ry="9" /><path d="M3 12h18" /></svg>
        {(["fa", "en"] as const).map(language => language === locale
          ? <span key={language} className="language-switch__active" lang={language} aria-current="true">{language === "fa" ? "فارسی" : "English"}</span>
          : <Link key={language} className="locale-link" href={alternatePath || `/${alternateLocale}`} scroll={false} onNavigate={() => { pendingLocaleScroll = captureLocaleScroll(alternatePath || `/${alternateLocale}`); }} lang={language} hrefLang={language} aria-label={language === "fa" ? "تغییر زبان به فارسی" : "Switch language to English"}>{language === "fa" ? "فارسی" : "English"}</Link>)}
      </div>
      <ButtonLink size="sm" href={consultationPath}>{copy.consultation}</ButtonLink>
      <button ref={toggleRef} className="mobile-menu-toggle" type="button" aria-label={locale === "fa" ? "باز کردن منو" : "Toggle menu"} aria-controls="mobile-navigation" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(!open)}><span aria-hidden="true">{open ? "×" : "☰"}</span></button>
    </div>
  </div><dialog ref={menuRef} id="mobile-navigation" className="mobile-nav" data-open={open} aria-labelledby="mobile-navigation-title" onCancel={() => setOpen(false)} onClick={(event) => {
    if (event.target !== event.currentTarget) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) setOpen(false);
  }}>
    <div className="mobile-nav__heading"><h2 id="mobile-navigation-title">{locale === "fa" ? "منوی سایت" : "Explore Jahan Academy"}</h2><button ref={closeRef} className="mobile-nav__close" type="button" aria-label={locale === "fa" ? "بستن منو" : "Close menu"} onClick={() => setOpen(false)}>×</button></div>
    <nav aria-label={locale === "fa" ? "ناوبری موبایل" : "Mobile navigation"}>{links(false)}
      <ButtonLink href={`/${locale}/free-consultation?source=mobile-menu`} onClick={() => setOpen(false)}>{locale === "fa" ? "مشاوره رایگان" : "Free consultation"}</ButtonLink>
      <Link href={consultationPath} onClick={() => setOpen(false)}>{copy.consultation}</Link>
    </nav>
  </dialog></header>;
}
