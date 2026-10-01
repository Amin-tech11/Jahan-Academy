import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/lib/site-content";

type NewsItem = { slug: string; type: string; title: { fa: string; en: string }; date: string };
const covers: Record<string, string> = {
  "prepare-for-consultation": "/journey/profile-assessment.png",
  "choosing-a-study-destination": "/destinations/united-kingdom.png",
  "jahan-academy-launch": "/home-hero-campus-v2.png",
};

export function HomeNewsTicker({ items, locale }: { items: NewsItem[]; locale: Locale }) {
  const entries = (duplicate: boolean) => <div className="home-news__group" aria-hidden={duplicate || undefined}>
    {items.map((item) => <Link className="home-news__card" href={`/${locale}/articles/${item.slug}`} key={item.slug} tabIndex={duplicate ? -1 : undefined} dir={locale === "fa" ? "rtl" : "ltr"}>
      <Image src={covers[item.slug] ?? "/home-hero-campus-v2.png"} alt="" fill sizes="(max-width: 600px) 80vw, 384px" className="home-news__image" />
      <div className="home-news__caption"><h3>{item.title[locale]}</h3><div className="home-news__meta"><span>{locale === "fa" ? (item.type === "news" ? "خبر" : "مقاله") : (item.type === "news" ? "News" : "Article")}</span><time dateTime={item.date}>{item.date}</time></div></div>
    </Link>)}
  </div>;
  return <div className="home-news"><div className="home-news__viewport"><div className="home-news__track" style={{ animationDuration: `${Math.max(40, items.length * 15)}s` }}>{entries(false)}{entries(true)}</div></div></div>;
}
