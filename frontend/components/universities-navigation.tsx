"use client";

import { useEffect, useState } from "react";
import styles from "./universities-guide.module.css";

export function UniversitiesNavigation({ title, items }: { title: string; items: { id: string; label: string }[] }) {
  const [active, setActive] = useState(items[0]?.id);

  useEffect(() => {
    const syncHash = () => {
      const id = window.location.hash.slice(1);
      setActive(items.some(item => item.id === id) ? id : items[0]?.id);
    };
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, [items]);

  return <nav className={styles.navigation} aria-label={title}>
    <h2>{title}</h2>
    <div className={styles.navigationTrack}>
      {items.map(item => <a key={item.id} href={`#${item.id}`} aria-current={active === item.id ? "location" : undefined} onClick={() => setActive(item.id)}>{item.label}</a>)}
    </div>
  </nav>;
}
