import { SiteShell } from "@/components/site-shell";
import { blogDate } from "@/lib/blog-content";
import type { Locale } from "@/lib/site-content";
import styles from "./editorial-detail.module.css";

export function EditorialDetail({ locale, title, date, excerpt, sections = [], sources = [] }: {
  locale: Locale;
  title: string;
  date: string;
  excerpt: string;
  sections?: { title: string; body: string }[];
  sources?: { title: string; url: string }[];
}) {
  return <SiteShell locale={locale} className={styles.page}>
    <main className={styles.main}>
      <article className={styles.article} aria-labelledby="editorial-title">
        <header className={styles.header}>
          <h1 id="editorial-title">{title}</h1>
          <p className={styles.date}>{locale === "fa" ? "تاریخ انتشار: " : "Published: "}<time dateTime={date}>{blogDate(date, locale)}</time></p>
        </header>
        <div className={styles.content}>
          <p>{excerpt}</p>
          {sections.map(section => <section key={section.title}><h2>{section.title}</h2><p>{section.body}</p></section>)}
          {sources.length > 0 && <section aria-labelledby="guide-sources"><h2 id="guide-sources">{locale === "fa" ? "منابع رسمی برای بررسی شرایط روز" : "Official sources for current requirements"}</h2><ul>{sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a></li>)}</ul></section>}
        </div>
      </article>
    </main>
  </SiteShell>;
}
