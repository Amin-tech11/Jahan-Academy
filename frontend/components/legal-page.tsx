import { SiteShell } from "@/components/site-shell";
import { legalContent } from "@/lib/legal-content";
import { type Locale } from "@/lib/site-content";
import styles from "./legal-page.module.css";

export function LegalPage({ locale, page }: { locale: Locale; page: "privacy" }) {
  const document = legalContent[locale][page];
  return <SiteShell locale={locale}><main className={styles.privacy}>
    <section className={`hero ${styles.privacyHero}`}><div className={`shell ${styles.content}`}><h1>{document.title}</h1><p className="hero-text">{document.intro}</p><p>{locale === "fa" ? "تاریخ آخرین بازبینی: ۱۹ مهر ۱۴۰۵" : "Last reviewed: 11 October 2026"}</p></div></section>
    <section className="section"><article className={`shell prose ${styles.content} ${styles.document}`}>
      {document.sections.map((section) => <section key={section.title}>
        <h2>{section.title}</h2>
        {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </section>)}
    </article></section>
  </main></SiteShell>;
}
