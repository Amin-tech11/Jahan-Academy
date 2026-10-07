"use client";

import { useEffect, useRef, useState } from "react";

export function BlogNavigation({ title, items }: { title: string; items: Array<{ id: string; label: string }> }) {
  const nav = useRef<HTMLElement>(null);
  const [active, setActive] = useState(items[0]?.id);
  useEffect(() => {
    const navigation = nav.current;
    const page = navigation?.closest<HTMLElement>(".journal-page");
    const header = navigation?.closest(".site")?.querySelector<HTMLElement>(".site-header");
    if (!navigation || !page || !header) return;
    const sections = items.map(item => document.getElementById(item.id));
    let frame = 0;
    const sync = () => {
      frame = 0;
      const headerHeight = header.getBoundingClientRect().height;
      page.style.setProperty("--journal-header-height", `${headerHeight}px`);
      page.style.setProperty("--journal-scroll-offset", `${headerHeight + navigation.getBoundingClientRect().height + 20}px`);
      const top = Math.max(header.getBoundingClientRect().bottom, navigation.getBoundingClientRect().bottom);
      let largest = 0;
      let current = items[0]?.id;
      sections.forEach((section, index) => {
        if (!section) return;
        const box = section.getBoundingClientRect();
        const visible = Math.max(0, Math.min(box.bottom, window.innerHeight) - Math.max(box.top, top));
        if (visible > largest) { largest = visible; current = items[index].id; }
      });
      if (largest) setActive(current);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(sync); };
    const observer = new ResizeObserver(schedule);
    [header, navigation, ...sections].forEach(element => { if (element) observer.observe(element); });
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("hashchange", schedule);
    sync();
    return () => {
      cancelAnimationFrame(frame); observer.disconnect();
      window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule); window.removeEventListener("hashchange", schedule);
      page.style.removeProperty("--journal-header-height"); page.style.removeProperty("--journal-scroll-offset");
    };
  }, [items]);
  return <nav ref={nav} className="journal-navigation" aria-label={title}><h1>{title}</h1><div className="journal-navigation-track">{items.map(item => <a key={item.id} href={`#${item.id}`} aria-current={active === item.id ? "location" : undefined} onClick={() => setActive(item.id)}>{item.label}</a>)}</div></nav>;
}
