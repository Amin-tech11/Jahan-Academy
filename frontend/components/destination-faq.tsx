"use client";

import { useId, useState } from "react";
import type { DestinationFaqItem } from "@/lib/destination-faqs";
import type { Locale } from "@/lib/site-content";
import styles from "./destination-faq.module.css";

export function DestinationFaq({ items, locale }: { items: readonly DestinationFaqItem[]; locale: Locale }) {
  const [active, setActive] = useState<number | null>(null);
  const prefix = useId();
  return <div className={styles.list}>{items.map((item, index) => {
    const open = active === index;
    const buttonId = `${prefix}-question-${index}`, answerId = `${prefix}-answer-${index}`;
    return <div className={styles.item} data-open={open} data-destination-motion="up" data-destination-delay={index * 60} key={item.question.en}>
      <h3 className={styles.question}><button type="button" id={buttonId} aria-expanded={open} aria-controls={answerId} onClick={() => setActive((current) => current === index ? null : index)}>
        <span className={styles.icon} aria-hidden="true"><svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M9.6 9a2.5 2.5 0 0 1 4.9.7c0 1.8-2.5 2-2.5 3.3" /><circle cx="12" cy="16.5" r=".8" fill="currentColor" stroke="none" /></svg></span>
        <span className={styles.text}>{item.question[locale]}</span>
        <svg className={styles.chevron} aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="m3 6 5 5 5-5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button></h3>
      <div className={styles.answer} id={answerId} role="region" aria-labelledby={buttonId} aria-hidden={!open} inert={!open}>
        <div className={styles.inner}><div className={styles.copy}><p>{item.answer[locale]}</p><a href={item.source.url} target="_blank" rel="noopener noreferrer">{locale === "fa" ? "منبع رسمی" : "Official source"} · <bdi>{item.source.name}</bdi><span aria-hidden="true"> ↗</span><span className={styles.srOnly}>{locale === "fa" ? " (در پنجره جدید)" : " (opens in a new window)"}</span></a></div></div>
      </div>
    </div>;
  })}</div>;
}
