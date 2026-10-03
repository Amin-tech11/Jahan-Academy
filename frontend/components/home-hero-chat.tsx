"use client";

import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/site-content";
import { startHeroChat, type HeroChatFrame } from "@/lib/home-hero-chat";

const conversations = {
  fa: [
    { topic: "انتخاب مقصد", question: "سلام! برای ادامه تحصیل بین آلمان و کانادا مرددم. از کجا شروع کنم؟", answer: "سلام، خوش آمدید! از رشته، هدف و شرایط شما شروع می‌کنیم و گزینه‌ها را با هم می‌سنجیم." },
    { topic: "انتخاب دانشگاه", question: "چطور دانشگاهی پیدا کنم که با رشته و شرایط من مناسب باشد؟", answer: "سوابق تحصیلی، سطح زبان و اولویت‌هایتان را بررسی می‌کنیم تا گزینه‌های مناسب‌تری پیش رو داشته باشید." },
    { topic: "آماده‌سازی مدارک", question: "برای رزومه و انگیزه‌نامه‌ام راهنمایی می‌خواهم. کمکم می‌کنید؟", answer: "حتماً! ابتدا مدارک و سوابقتان را مرور می‌کنیم و برای نگارش و آماده‌سازی آن‌ها راهنمایی‌تان می‌کنیم." },
  ],
  en: [
    { topic: "Study destinations", question: "Hi! I am considering Germany or Canada for my studies. Where should I start?", answer: "Welcome! We start with your subject, goals and circumstances, then explore the options together." },
    { topic: "Choosing a university", question: "How can I find a university that suits my subject and background?", answer: "We review your academic record, language level and priorities to help you explore suitable options." },
    { topic: "Application documents", question: "Could you help me with my CV and statement of purpose?", answer: "Of course! We start by reviewing your background and documents, then guide you through preparing them." },
  ],
};

export function HomeHeroChat({ locale }: { locale: Locale }) {
  const root = useRef<HTMLDivElement>(null);
  const controller = useRef<ReturnType<typeof startHeroChat> | null>(null);
  const [frame, setFrame] = useState<HeroChatFrame>({ scene: 0, phase: 2 });
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (!root.current) return;
    const player = startHeroChat(root.current, setFrame);
    controller.current = player;
    return () => { player.dispose(); controller.current = null; };
  }, []);
  const conversation = conversations[locale][frame.scene];
  const fa = locale === "fa";
  return <div className="home-hero-chat" ref={root} dir={fa ? "rtl" : "ltr"} role="group" aria-label={fa ? "نمونه گفت‌وگو با مشاور جهان آکادمی" : "Example conversation with a Jahan Academy advisor"} data-paused={paused || undefined}>
    <header className="home-hero-chat__header">
      <span className="home-hero-chat__avatar" aria-hidden="true"><svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 13v-2a8 8 0 0 1 16 0v5a4 4 0 0 1-4 4h-3M4 11H2v6h4v-6H4Zm16 0h2v6h-4v-6h2Z" /><path d="M9 20h4" /></svg></span>
      <div><strong>{fa ? "جهان آکادمی" : "Jahan Academy"}</strong><span>{fa ? "نمونه گفت‌وگو با مشاور" : "A sample advisor conversation"}</span></div>
      <button className="home-hero-chat__pause" type="button" aria-pressed={paused} onClick={() => { const next = !paused; setPaused(next); controller.current?.setPaused(next); }}>
        {paused ? (fa ? "ادامه نمایش" : "Resume") : (fa ? "توقف نمایش" : "Pause")}
      </button>
    </header>
    <div className="home-hero-chat__body" aria-live="off" key={frame.scene}>
      <p className="home-hero-chat__topic">{conversation.topic}</p>
      <div className="home-hero-chat__message home-hero-chat__message--visitor"><span>{fa ? "شما" : "You"}</span><p>{conversation.question}</p></div>
      <div className="home-hero-chat__reply">
        {frame.phase === 1 && <div className="home-hero-chat__typing" aria-label={fa ? "مشاور در حال نوشتن است" : "Advisor is typing"}><span>{fa ? "مشاور در حال نوشتن" : "Advisor is typing"}</span><i /><i /><i /></div>}
        {frame.phase === 2 && <div className="home-hero-chat__message home-hero-chat__message--advisor"><span>{fa ? "مشاور جهان آکادمی" : "Jahan Academy advisor"}</span><p>{conversation.answer}</p></div>}
      </div>
    </div>
    <div className="home-hero-chat__footer" aria-hidden="true"><span>{fa ? "هر مسیر، با یک گفت‌وگو شروع می‌شود" : "Every journey begins with a conversation"}</span><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m21 3-7 18-4-7-7-4 18-7ZM10 14 21 3" /></svg></div>
  </div>;
}
