"use client";

import { useEffect, useState } from "react";
import styles from "./about-page.module.css";

const sections = ["story", "purpose", "values", "journey", "questions"];

export function AboutNavigation({ labels, title }: { labels: string[]; title: string }) {
  const [active, setActive] = useState("story");
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      // Align the active item with the section arriving below the sticky navigation.
      const marker = window.innerWidth <= 800 ? 220 : 250;
      let current = sections[0];
      for (const id of sections) {
        const element = document.getElementById(id);
        if (element && element.getBoundingClientRect().top <= marker) current = id;
      }
      setActive(current);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);
  return <div className={styles.navigation}>
    <h2>{title}</h2>
    <nav className={styles.sectionNav} aria-label={title}>{sections.map((id, i) => <a key={id} href={`#${id}`} aria-current={active === id ? "location" : undefined}>{labels[i]}</a>)}</nav>
  </div>;
}
