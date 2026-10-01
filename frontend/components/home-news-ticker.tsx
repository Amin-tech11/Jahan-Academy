"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, type PointerEvent } from "react";
import type { Locale } from "@/lib/site-content";

type NewsItem = { slug: string; type: string; title: { fa: string; en: string }; date: string };
const covers: Record<string, string> = {
  "prepare-for-consultation": "/journey/profile-assessment.png",
  "choosing-a-study-destination": "/destinations/united-kingdom.png",
  "jahan-academy-launch": "/home-hero-campus-v2.png",
};

export function HomeNewsTicker({ items, locale }: { items: NewsItem[]; locale: Locale }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const gesture = useRef<{ id: number; startX: number; startY: number; lastX: number; dragged: boolean } | null>(null);
  const suppressClick = useRef(false);

  const startDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || event.button !== 0) return;
    suppressClick.current = false;
    gesture.current = { id: event.pointerId, startX: event.clientX, startY: event.clientY, lastX: event.clientX, dragged: false };
  };
  const moveDrag = (event: PointerEvent<HTMLDivElement>) => {
    const drag = gesture.current;
    const track = trackRef.current;
    if (!drag || drag.id !== event.pointerId || !track) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (!drag.dragged) {
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 6) { gesture.current = null; return; }
      if (Math.abs(dx) < 6) return;
      drag.dragged = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      event.currentTarget.dataset.dragging = "true";
    }
    const animation = track.getAnimations()[0];
    const width = track.scrollWidth / 2;
    const duration = animation?.effect?.getComputedTiming().duration;
    if (animation && typeof duration === "number" && width > 0) {
      const time = Number(animation.currentTime ?? 0) + (event.clientX - drag.lastX) / width * duration;
      animation.currentTime = ((time % duration) + duration) % duration;
    } else if (viewportRef.current) {
      viewportRef.current.scrollLeft -= event.clientX - drag.lastX;
    }
    drag.lastX = event.clientX;
    event.preventDefault();
  };
  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    const drag = gesture.current;
    if (!drag || drag.id !== event.pointerId) return;
    suppressClick.current = drag.dragged;
    gesture.current = null;
    delete event.currentTarget.dataset.dragging;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const entries = (duplicate: boolean) => <div className="home-news__group" aria-hidden={duplicate || undefined}>
    {items.map((item) => <Link className="home-news__card" href={`/${locale}/articles/${item.slug}`} key={item.slug} tabIndex={duplicate ? -1 : undefined} dir={locale === "fa" ? "rtl" : "ltr"} draggable={false}>
      <Image src={covers[item.slug] ?? "/home-hero-campus-v2.png"} alt="" fill sizes="(max-width: 600px) 80vw, 384px" className="home-news__image" draggable={false} />
      <div className="home-news__caption"><h3>{item.title[locale]}</h3><div className="home-news__meta"><span>{locale === "fa" ? (item.type === "news" ? "خبر" : "مقاله") : (item.type === "news" ? "News" : "Article")}</span><time dateTime={item.date}>{item.date}</time></div></div>
    </Link>)}
  </div>;
  return <div className="home-news"><div className="home-news__viewport" ref={viewportRef} onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} onLostPointerCapture={endDrag} onClickCapture={(event) => { if (suppressClick.current) { event.preventDefault(); event.stopPropagation(); suppressClick.current = false; } }}><div className="home-news__track" ref={trackRef} style={{ animationDuration: `${Math.max(40, items.length * 15)}s` }}>{entries(false)}{entries(true)}</div></div></div>;
}
