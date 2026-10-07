import type { Locale } from "@/lib/site-content";
import Image from "next/image";
import { HomeConsultation } from "./home-consultation";
import { universityContent, universityRankingSources } from "@/lib/universities-content";
import { HomeUniversityShowcase } from "./home-university-showcase";
import { HomeFaq } from "./home-faq";
import { UniversityCriteriaIcon } from "./university-criteria-icon";
import styles from "./universities-guide.module.css";
import { UniversitiesNavigation } from "./universities-navigation";
import { UniversityTypeIcon } from "./university-type-icon";
import { UniversityRankingIcon } from "./university-ranking-icon";

const sectionIds = ["university-types", "university-rankings", "university-countries", "university-criteria", "college-university", "university-faq"];

export function UniversitiesGuide({ locale }: { locale: Locale }) {
  const content = universityContent[locale];
  return <div className={`shell ${styles.guide}`}>
    <div className={styles.guideContent}>
    <UniversitiesNavigation title={content.title} items={content.sections.map((label, index) => ({ id: sectionIds[index], label })).filter(item => item.id !== "university-faq")} />
    <div className={styles.intro}><p>{content.intro}</p></div>
    <section id={sectionIds[0]} className={styles.section}><h2>{content.sections[0]}</h2><div className={styles.cards}>{content.types.map((item, index) => <article className={`${styles.card} ${styles.typeCard}`} key={item.title}><span className={styles.typeIcon}><UniversityTypeIcon index={index} /></span><h3>{item.title}</h3><p>{item.text}</p></article>)}</div></section>
    <section id={sectionIds[1]} className={styles.section}><h2>{content.sections[1]}</h2><p>{content.rankingIntro}</p><div className={styles.cards}>{content.rankings.map((item, index) => <article className={`${styles.card} ${styles.typeCard}`} key={item.title}><span className={styles.typeIcon}><UniversityRankingIcon index={index} /></span><h3 dir="ltr">{item.title}</h3><p>{item.text}</p><a href={universityRankingSources[index]} target="_blank" rel="noreferrer">{content.rankingLink} ↗</a></article>)}</div></section>
    <section id={sectionIds[2]} className={`${styles.section} ${styles.showcase}`}><h2>{content.sections[2]}</h2><HomeUniversityShowcase locale={locale} /><p className={styles.universityNote}>{locale === "fa" ? "نمایش این دانشگاه‌ها به معنی همکاری یا تضمین پذیرش نیست." : "Listing these universities does not imply a partnership or guaranteed admission."}</p></section>
    <section id={sectionIds[3]} className={styles.section}>
      <header>
        <h2>{content.sections[3]}</h2>
        <p>{locale === "fa" ? "با در نظر گرفتن این معیارها، مسیر تحصیلی آگاهانه‌تری برای آینده خود بسازید." : "Consider these criteria to make a more informed choice about your study path."}</p>
      </header>
      <div className={styles.criteria}>{content.criteria.map((item, index) => <article className={`${styles.card} ${styles.typeCard}`} key={item.title}><span className={styles.typeIcon}><UniversityCriteriaIcon index={index} /></span><div><h3>{item.title}</h3><p>{item.text}</p></div></article>)}</div>
    </section>
    <section id={sectionIds[4]} className={styles.section}><h2>{content.sections[4]}</h2><p>{content.collegeIntro}</p><div className={styles.tableWrap}><table><thead><tr>{content.comparisonLabels.map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead><tbody>{content.comparison.map(row => <tr key={row[0]}><th scope="row">{row[0]}</th><td>{row[1]}</td><td>{row[2]}</td></tr>)}</tbody></table></div></section>
    <section id={sectionIds[5]} className={`${styles.section} ${styles.faq}`} aria-labelledby="university-faq-title"><div className="home-faq__grid"><div className="home-faq__intro"><h2 id="university-faq-title">{content.sections[5]}</h2></div><HomeFaq items={content.faq} /></div></section>
    </div>
    <section className={`home-closing ${styles.consultation}`} id="university-consultation" aria-labelledby="university-closing-title">
      <header className="home-closing__heading">
        <h2 id="university-closing-title">{locale === "fa" ? "برای انتخاب دانشگاه مناسب آماده‌اید؟" : "Ready to find the right university?"}</h2>
        <p>{locale === "fa" ? "از رشته و شرایط تحصیلی خود بگویید تا در بررسی دانشگاه‌ها و انتخاب گزینه‌های متناسب با هدفتان همراه شما باشیم." : "Tell us about your subject and academic background so we can help you explore universities that fit your goals."}</p>
      </header>
      <div className="home-closing__layout">
        <div className="home-closing__image"><Image src="/journey/profile-assessment.png" alt={locale === "fa" ? "مشاوره برای انتخاب دانشگاه و مسیر تحصیلی" : "University selection consultation"} fill sizes="(max-width: 800px) 100vw, 50vw" /></div>
        <HomeConsultation locale={locale} sourcePage={`/${locale}/universities#university-consultation`} />
      </div>
    </section>
  </div>;
}
