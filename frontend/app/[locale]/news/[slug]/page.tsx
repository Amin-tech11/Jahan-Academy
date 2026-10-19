import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PreparedImage } from "@/components/prepared-image";
import { SiteShell } from "@/components/site-shell";
import { blogDate } from "@/lib/blog-content";
import { isLocale } from "@/lib/site-content";
import { universityNews } from "@/lib/university-news";
import { pageMetadata, siteOrigin } from "@/lib/site-seo";
import styles from "@/components/editorial-detail.module.css";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const news = universityNews.find(item => item.slug === slug);
  if (!news || !isLocale(locale)) return {};
  const metadata = pageMetadata(locale, `/news/${news.slug}`, news.seoTitle[locale], news.excerpt[locale]);
  return { ...metadata,
    openGraph: { ...metadata.openGraph, type: "article", publishedTime: news.date,
      images: [{ url: `${siteOrigin}${news.image}`, alt: news.imageAlt[locale] }] },
    twitter: { ...metadata.twitter, images: [`${siteOrigin}${news.image}`] },
  };
}

export default async function NewsDetail({ params }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const news = universityNews.find(item => item.slug === slug);
  if (!news) notFound();
  return <SiteShell locale={locale} className={styles.page}>
    <main className={styles.main}><article className={styles.article} aria-labelledby="news-title">
      <div className={styles.newsActions}>
        <Link className={styles.newsBackButton} dir={locale === "fa" ? "rtl" : "ltr"} href={`/${locale}/articles#journal-news`}>{locale === "fa" ? "بازگشت به اخبار مجله" : "Back to journal news"}<span aria-hidden="true">←</span></Link>
      </div>
      <header className={styles.header}>
        <p>{news.category[locale]}</p><h1 id="news-title">{news.title[locale]}</h1>
        <p className={styles.date}>{locale === "fa" ? "انتشار جهان آکادمی: " : "Jahan Academy publication: "}<time dateTime={news.date}>{blogDate(news.date, locale)}</time>
          {" | "}{locale === "fa" ? "تاریخ منبع: " : "Source date: "}<time dateTime={news.sourceDate}>{blogDate(news.sourceDate, locale)}</time></p>
      </header>
      <figure className={styles.newsFigure}>
        <PreparedImage src={news.image} alt={news.imageAlt[locale]} width={1672} height={941} sizes="(max-width: 900px) 100vw, 800px" preload />
        <figcaption>{news.imageCaption[locale]}</figcaption>
      </figure>
      <div className={styles.content}>
        <p><strong>{news.excerpt[locale]}</strong></p>
        {news.paragraphs[locale].map((paragraph, index) => <p key={index}>{paragraph}</p>)}
        <section aria-labelledby="news-sources"><h2 id="news-sources">{locale === "fa" ? "منبع رسمی خبر" : "Official news source"}</h2>
          <ul>{news.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a></li>)}</ul>
        </section>
      </div>
    </article></main>
  </SiteShell>;
}
