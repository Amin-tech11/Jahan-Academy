"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/site-content";
import styles from "./mobile-consultation.module.css";

export function MobileConsultation({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const bar = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!visible || !bar.current) return;
    const measure = () => document.documentElement.style.setProperty("--mobile-consultation-height", `${bar.current?.getBoundingClientRect().height ?? 0}px`);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(bar.current);
    return () => observer.disconnect();
  }, [visible]);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 1199px)");
    const forms = new Set<Element>();
    const update = () => {
      const active = document.activeElement;
      const typing = active?.matches("input, textarea, select, [role=combobox], [contenteditable=true]");
      const viewport = window.visualViewport;
      const keyboard = viewport && viewport.scale === 1 && window.innerHeight - viewport.height > 160;
      setVisible(media.matches && !/^\/(fa|en)\/(free-consultation|consultation)(\/|$)/.test(pathname)
        && !typing && !keyboard && !forms.size && !document.querySelector("dialog[open]")
        && document.documentElement.dataset.mobileMenuOpen !== "true");
    };
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) forms.add(entry.target); else forms.delete(entry.target);
      }
      update();
    });
    document.querySelectorAll("[data-consultation-form], .home-consultation__form, .consultation-request-form, .assessment-form, .services-request, .consultation-form").forEach(form => observer.observe(form));
    const mutation = new MutationObserver(update);
    mutation.observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ["open", "data-mobile-menu-open"] });
    let focusTimer: number | undefined;
    const focus = () => { window.clearTimeout(focusTimer); focusTimer = window.setTimeout(update, 0); };
    document.addEventListener("focusin", update);
    document.addEventListener("focusout", focus);
    window.visualViewport?.addEventListener("resize", update);
    media.addEventListener("change", update);
    update();
    return () => {
      observer.disconnect(); mutation.disconnect();
      window.clearTimeout(focusTimer);
      document.removeEventListener("focusin", update);
      document.removeEventListener("focusout", focus);
      window.visualViewport?.removeEventListener("resize", update);
      media.removeEventListener("change", update);
    };
  }, [pathname]);
  return <aside ref={bar} className={styles.bar} data-mobile-consultation-visible={visible} hidden={!visible} aria-label={locale === "fa" ? "مشاوره رایگان" : "Free consultation"}>
    <Link href={`/${locale}/free-consultation?source=mobile-consultation`}>
      <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 4h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-8l-6 4v-4H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" /><path d="M7 9h10M7 13h6" /></svg>
      {locale === "fa" ? "مشاوره رایگان" : "Free consultation"}
      <span aria-hidden="true">{locale === "fa" ? "←" : "→"}</span>
    </Link>
  </aside>;
}
