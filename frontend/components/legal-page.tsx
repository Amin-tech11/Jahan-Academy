import Link from "next/link";
import { localPath, SiteShell } from "@/components/site-shell";
import { legalContent } from "@/lib/legal-content";
import { type Locale } from "@/lib/site-content";
import styles from "./legal-page.module.css";

export function LegalPage({ locale, page }: { locale: Locale; page: "privacy" | "terms" }) {
  const document = legalContent[locale][page];
  const isPrivacy = page === "privacy";
  const otherPage = page === "privacy" ? "terms" : "privacy";
  return <SiteShell locale={locale}><main className={isPrivacy ? styles.privacy : undefined}>
    <section className={`hero ${isPrivacy ? styles.privacyHero : ""}`}><div className={`shell ${styles.content}`}>{!isPrivacy && <p className="eyebrow">JAHAN ACADEMY</p>}<h1>{document.title}</h1><p className="hero-text">{document.intro}</p></div></section>
    <section className="section"><article className={`shell prose ${styles.content} ${styles.document}`}>
      {document.sections.map((section) => <section key={section.title}>
        <h2>{section.title}</h2>
        {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </section>)}
      {!isPrivacy && <>
        <p><Link className="text-link" href={localPath(locale, `/${otherPage}`)}>{legalContent[locale][otherPage].title}</Link></p>
        <Link className="button button-primary" href={localPath(locale, "/consultation")}>{document.requestLabel}</Link>
      </>}
    </article></section>
  </main></SiteShell>;
}
