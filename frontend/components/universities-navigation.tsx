"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./universities-guide.module.css";

export function UniversitiesNavigation({ title, items }: { title: string; items: { id: string; label: string }[] }) {
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
    const syncHash = () => {
      const id = window.location.hash.slice(1);
      setActive(items.some(item => item.id === id) ? id : items[0]?.id);
    };
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, [items]);

  return <nav ref={navigation} className={styles.navigation} aria-label={title}>
    <h2>{title}</h2>
    <div className={styles.navigationTrack}>
      {items.map(item => <a key={item.id} href={`#${item.id}`} aria-current={active === item.id ? "location" : undefined} onClick={() => setActive(item.id)}>{item.label}</a>)}
    </div>
  </nav>;
}
