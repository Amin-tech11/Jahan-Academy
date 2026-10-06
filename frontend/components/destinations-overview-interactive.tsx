"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./destinations-overview.module.css";

export function DestinationsNavigation({ title, items }: { title: string; items: { id: string; label: string }[] }) {
  const [active, setActive] = useState(items[0]?.id);
  const navigation = useRef<HTMLElement>(null);

  useEffect(() => {
    const nav = navigation.current;
    const header = nav?.closest(".site")?.querySelector<HTMLElement>(".site-header");
    const guide = nav?.parentElement;
    if (!nav || !header || !guide) return;
    const updateOffsets = () => {
      const headerHeight = header.getBoundingClientRect().height;
      guide.style.setProperty("--guide-header-height", `${headerHeight}px`);
      guide.style.setProperty("--guide-scroll-offset", `${headerHeight + nav.getBoundingClientRect().height + 20}px`);
    };
    const observer = new ResizeObserver(updateOffsets);
    observer.observe(header);
    observer.observe(nav);
    updateOffsets();
    return () => {
      observer.disconnect();
      guide.style.removeProperty("--guide-header-height");
      guide.style.removeProperty("--guide-scroll-offset");
    };
  }, []);

  useEffect(() => {
    const nav = navigation.current;
    const header = nav?.closest(".site")?.querySelector<HTMLElement>(".site-header");
    if (!nav || !header) return;
    const sections = items.map(item => document.getElementById(item.id));
    let frame = 0;
    const syncPosition = () => {
      frame = 0;
      // Measure visible content below the actual sticky bar, not a heading threshold.
      const visibleTop = Math.max(header.getBoundingClientRect().bottom, nav.getBoundingClientRect().bottom);
      const visibleBottom = window.innerHeight;
      let current = items[0]?.id;
      let largestVisibleArea = 0;
      sections.forEach((section, index) => {
        if (!section) return;
        const bounds = section.getBoundingClientRect();
        const visibleArea = Math.max(0, Math.min(bounds.bottom, visibleBottom) - Math.max(bounds.top, visibleTop));
        if (visibleArea > largestVisibleArea) {
          largestVisibleArea = visibleArea;
          current = items[index].id;
        }
      });
      if (largestVisibleArea > 0) setActive(current);
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(syncPosition);
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(header);
    observer.observe(nav);
    sections.forEach(section => { if (section) observer.observe(section); });
    syncPosition();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("hashchange", schedule);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("hashchange", schedule);
    };
  }, [items]);

  return <nav ref={navigation} className={styles.navigation} aria-label={title}>
    <h2>{title}</h2>
    <div className={styles.navigationTrack}>
      {items.map(item => <a key={item.id} href={`#${item.id}`} aria-current={active === item.id ? "location" : undefined} onClick={() => setActive(item.id)}>{item.label}</a>)}
    </div>
  </nav>;
}
