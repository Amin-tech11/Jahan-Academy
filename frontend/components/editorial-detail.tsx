import { SiteShell } from "@/components/site-shell";
import { blogDate } from "@/lib/blog-content";
import type { Locale } from "@/lib/site-content";
import styles from "./editorial-detail.module.css";

export function EditorialDetail({ locale, title, date, excerpt, sections = [] }: {
  locale: Locale;
  title: string;
  date: string;
  excerpt: string;
  sections?: { title: string; body: string }[];
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
        </div>
      </article>
    </main>
  </SiteShell>;
}
