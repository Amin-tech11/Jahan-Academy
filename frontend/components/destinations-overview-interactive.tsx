"use client";

import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import type { Locale } from "@/lib/site-content";
import styles from "./destinations-overview.module.css";

export function DestinationsTabs({ locale, panels }: { locale: Locale; panels: [ReactNode, ReactNode, ReactNode, ReactNode] }) {
  const fa = locale === "fa";
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const labels = fa
    ? ["نمای کلی", "همهٔ مقصدها", "راهنمای انتخاب", "پرسش‌های پرتکرار"]
    : ["Overview", "All destinations", "Choosing a destination", "Common questions"];
  const names = ["overview", "countries", "guide", "questions"];
  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const direction = fa ? -1 : 1;
    const next = event.key === "Home" ? 0 : event.key === "End" ? 3
      : event.key === "ArrowRight" ? (active + direction + 4) % 4
        : event.key === "ArrowLeft" ? (active - direction + 4) % 4 : undefined;
    if (next !== undefined) { event.preventDefault(); setActive(next); tabs.current[next]?.focus(); }
  }
  return <section className={styles.details} aria-label={fa ? "راهنمای مقصدهای تحصیلی" : "Study destination guide"}>
    <div role="tablist" className={styles.tabs} aria-label={fa ? "بخش‌های راهنمای مقصدها" : "Destination guide sections"}>
      {labels.map((label, index) => <button type="button" key={names[index]} ref={(element) => { tabs.current[index] = element; }} id={`destination-tab-${names[index]}`} role="tab" aria-selected={active === index} aria-controls={`destination-panel-${names[index]}`} tabIndex={active === index ? 0 : -1} onClick={() => setActive(index)} onKeyDown={onKeyDown}>{label}</button>)}
    </div>
    {panels.map((content, index) => <div key={names[index]} id={`destination-panel-${names[index]}`} role="tabpanel" aria-labelledby={`destination-tab-${names[index]}`} hidden={active !== index} tabIndex={0} className={styles.tabContent}>{content}</div>)}
  </section>;
}

export function FeaturedDestinationsLink({ locale, children }: { locale: Locale; children: ReactNode }) {
  return <button className={styles.featuredLink} type="button" onClick={() => document.getElementById("destination-tab-countries")?.click()}>
    {children}<span aria-hidden="true">{locale === "fa" ? "←" : "→"}</span>
  </button>;
}
