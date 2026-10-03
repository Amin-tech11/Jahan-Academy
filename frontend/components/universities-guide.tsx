import type { Locale } from "@/lib/site-content";
import { universityContent, universityRankingSources } from "@/lib/universities-content";
import { HomeUniversityShowcase } from "./home-university-showcase";
import { ConsultationButton } from "./site-shell";
import styles from "./universities-guide.module.css";
import { UniversitiesNavigation } from "./universities-navigation";
import { UniversityTypeIcon } from "./university-type-icon";
import { UniversityRankingIcon } from "./university-ranking-icon";

const sectionIds = ["university-types", "university-rankings", "university-countries", "university-criteria", "college-university", "university-faq"];

export function UniversitiesGuide({ locale }: { locale: Locale }) {
  const content = universityContent[locale];
  return <div className={`shell ${styles.guide}`}>
    <UniversitiesNavigation title={content.title} items={content.sections.map((label, index) => ({ id: sectionIds[index], label }))} />
    <div className={styles.intro}><p>{content.intro}</p></div>
    <section id={sectionIds[0]} className={styles.section}><h2>{content.sections[0]}</h2><div className={styles.cards}>{content.types.map((item, index) => <article className={`${styles.card} ${styles.typeCard}`} key={item.title}><span className={styles.typeIcon}><UniversityTypeIcon index={index} /></span><h3>{item.title}</h3><p>{item.text}</p></article>)}</div><a className={styles.source} href="https://educationusa.state.gov/experience-studying-usa/us-educational-system/frequently-asked-questions-faqs" target="_blank" rel="noreferrer">EducationUSA ↗</a></section>
    <section id={sectionIds[1]} className={styles.section}><h2>{content.sections[1]}</h2><p>{content.rankingIntro}</p><div className={styles.cards}>{content.rankings.map((item, index) => <article className={`${styles.card} ${styles.typeCard}`} key={item.title}><span className={styles.typeIcon}><UniversityRankingIcon index={index} /></span><h3 dir="ltr">{item.title}</h3><p>{item.text}</p><a href={universityRankingSources[index]} target="_blank" rel="noreferrer">{content.rankingLink} ↗</a></article>)}</div></section>
    <section id={sectionIds[2]} className={`${styles.section} ${styles.showcase}`}><h2>{content.sections[2]}</h2><HomeUniversityShowcase locale={locale} /><p className={styles.universityNote}>{locale === "fa" ? "نمایش این دانشگاه‌ها به معنی همکاری یا تضمین پذیرش نیست." : "Listing these universities does not imply a partnership or guaranteed admission."}</p></section>
    <section id={sectionIds[3]} className={styles.section}><h2>{content.sections[3]}</h2><div className={styles.criteria}>{content.criteria.map((item, index) => <article className={styles.card} key={item.title}><span className={styles.number} aria-hidden="true">0{index + 1}</span><h3>{item.title}</h3><p>{item.text}</p></article>)}</div></section>
    <section id={sectionIds[4]} className={styles.section}><h2>{content.sections[4]}</h2><p>{content.collegeIntro}</p><div className={styles.tableWrap}><table><thead><tr>{content.comparisonLabels.map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead><tbody>{content.comparison.map(row => <tr key={row[0]}><th scope="row">{row[0]}</th><td>{row[1]}</td><td>{row[2]}</td></tr>)}</tbody></table></div></section>
    <section id={sectionIds[5]} className={styles.section}><h2>{content.sections[5]}</h2><div className="faq-list">{content.faq.map(item => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</div></section>
    <section className={styles.closing}><div><h2>{content.closingTitle}</h2><p>{content.closingText}</p></div><ConsultationButton locale={locale} source="universities" /></section>
  </div>;
}
