"use client";

import { useEffect, useId, useState, type ReactNode } from "react";

export function HomeJourneyStep({ number, title, text, locale, rail, media }: {
  number: string; title: string; text: string; locale: "fa" | "en"; rail: ReactNode; media: ReactNode;
}) {
  const [compact, setCompact] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const detail = useId();
  useEffect(() => {
    const query = window.matchMedia("(max-width: 1199px)");
    const update = () => setCompact(query.matches);
    update(); query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return <li className="home-process__step" data-step-expanded={expanded} data-step-number={number}>
    {rail}{media}
    <div className="home-process__copy" dir={locale === "fa" ? "rtl" : "ltr"}>
      <h3>{compact ? <button className="home-process__toggle" type="button" aria-expanded={expanded} aria-controls={detail} onClick={() => setExpanded(value => !value)}>
        <span>{title}</span><svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m6 9 6 6 6-6" /></svg>
      </button> : title}</h3>
      <p className="home-process__detail" id={detail}>{text}</p>
    </div>
  </li>;
}
