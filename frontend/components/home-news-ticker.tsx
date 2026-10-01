"use client";

import Link from "next/link";
import { useState } from "react";
import type { Locale } from "@/lib/site-content";

type NewsItem = { slug: string; type: string; title: { fa: string; en: string }; date: string };

export function HomeNewsTicker({ items, locale }: { items: NewsItem[]; locale: Locale }) {
  const [paused, setPaused] = useState(false);
  const entries = (duplicate: boolean) => <div className="home-news__group" aria-hidden={duplicate || undefined}>
    {items.map((item) => <Link className="home-news__item" href={`/${locale}/articles/${item.slug}`} key={item.slug} tabIndex={duplicate ? -1 : undefined} dir={locale === "fa" ? "rtl" : "ltr"}>
      <span className="home-news__label">{locale === "fa" ? (item.type === "news" ? "خبر" : "مقاله") : (item.type === "news" ? "News" : "Article")}</span>
      <span>{item.title[locale]}</span><time dateTime={item.date}>{item.date}</time>
    </Link>)}
  </div>;
  return <div className="home-news" data-paused={paused}>
    <button type="button" className="home-news__pause" onClick={() => setPaused(!paused)} aria-label={locale === "fa" ? (paused ? "ادامهٔ حرکت خبرها" : "توقف حرکت خبرها") : (paused ? "Resume news ticker" : "Pause news ticker")} aria-pressed={paused}>
      <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">{paused ? <path d="M6 3v14l11-7Z" /> : <><path d="M5 3h3v14H5Z" /><path d="M12 3h3v14h-3Z" /></>}</svg>
    </button>
    <div className="home-news__viewport"><div className="home-news__track" style={{ animationDuration: `${Math.max(35, items.length * 12)}s` }}>{entries(false)}{entries(true)}</div></div>
  </div>;
}

