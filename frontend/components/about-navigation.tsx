"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./about-page.module.css";

const sections = ["story", "purpose", "values", "journey"];

export function AboutNavigation({ labels, title }: { labels: string[]; title: string }) {
  const navigation = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState("story");
  useEffect(() => {
    const nav = navigation.current;
    if (!nav) return;
    const header = nav.closest(".site")?.querySelector<HTMLElement>(".site-header");
    const targets = sections.map(id => document.getElementById(id));
    let frame = 0;
    const update = () => {
      frame = 0;
      // Compare actual exposed area, excluding content covered by the sticky bars.
      const top = Math.max(0, header?.getBoundingClientRect().bottom ?? 0, nav.getBoundingClientRect().bottom);
      let largest = 0;
      let current: string | undefined;
      targets.forEach((element, index) => {
        if (!element) return;
        const box = element.getBoundingClientRect();
        const height = Math.max(0, Math.min(box.bottom, window.innerHeight) - Math.max(box.top, top));
        const width = Math.max(0, Math.min(box.right, window.innerWidth) - Math.max(box.left, 0));
        const area = height * width;
        if (area > largest) { largest = area; current = sections[index]; }
      });
      if (current) setActive(current);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(schedule);
    [nav, header, ...targets].forEach(element => { if (element) observer?.observe(element); });
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("hashchange", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("hashchange", schedule);
      observer?.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);
  return <div ref={navigation} className={styles.navigation}>
    <h2>{title}</h2>
    <nav className={styles.sectionNav} aria-label={title}>{sections.map((id, i) => <a key={id} href={`#${id}`} aria-current={active === id ? "location" : undefined}>{labels[i]}</a>)}</nav>
  </div>;
}
