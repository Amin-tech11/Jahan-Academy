import type { Locale } from "@/lib/site-content";
import { DestinationComparison } from "./destination-decision-tools";
import styles from "./destinations-overview.module.css";

function DestinationCriterionIcon({ index }: { index: number }) {
  const paths = [
    "M4 4h16v12H9l-5 4V4Zm4 5h8m-8 3h5",
    "M3 21h18M5 21V9h6v12m0-16h7v16M7 12h2m-2 4h2m5-7h2m-2 4h2m-2 4h2M3 5h4m-2-2v4",
    "m3 13 7-2 5-8 2 1-2 8 6 4-1 2-7-2-3 5-2-1 1-6-6 1-1-2Z",
  ];
  return <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[index]} /></svg>;
}

export function DestinationDecisionGuide({ locale }: { locale: Locale }) {
  const t = (fa: string, en: string) => locale === "fa" ? fa : en;
  const criteria = [
    [t("زبان زندگی روزمره", "Everyday language"), t("با زبان‌های رایج مقصد آشنا شوید و راحتی خود در ارتباط روزمره را در نظر بگیرید.", "Get to know the destination’s common languages and consider your comfort with everyday communication.")],
    [t("محیط و سبک زندگی", "Surroundings and lifestyle"), t("فضای شهری، آب‌وهوا، حمل‌ونقل و دسترسی به خدمات را کنار عادت‌ها و سبک زندگی موردعلاقه‌تان بررسی کنید.", "Consider the urban setting, climate, transport and access to services alongside your habits and preferred lifestyle.")],
    [t("فاصله و ارتباط با خانواده", "Distance and family connections"), t("فاصله جغرافیایی، اختلاف ساعت و اهمیت ارتباط با خانواده را در شناخت مقصد لحاظ کنید.", "Consider geographical distance, time differences and the importance of staying connected with family.")],
  ];
  return <>
    <section id="destination-criteria" className={styles.section} aria-labelledby="destination-criteria-title">
      <div className={styles.decisionHeading}><h2 id="destination-criteria-title">{t("معیارهای شناخت مقصد", "Getting to know a destination")}</h2></div>
      <div className={styles.decisionCriteria}>{criteria.map(([title, text], index) => <article className={`${styles.card} ${styles.typeCard}`} key={title}><span className={styles.typeIcon}><DestinationCriterionIcon index={index} /></span><h3>{title}</h3><p>{text}</p></article>)}</div>
    </section>
    <section id="destination-comparison" className={styles.section} aria-labelledby="destination-comparison-title">
      <div className={styles.decisionHeading}><h2 id="destination-comparison-title">{t("نگاهی کنار هم به کشورها", "Countries at a glance")}</h2><p>{t("نام کشور، پایتخت و زبان‌های رایج را کنار هم ببینید و برای آشنایی بیشتر، معرفی مقصد را بخوانید.", "View country names, capitals and common languages side by side, then read the destination introductions.")}</p></div>
      <DestinationComparison locale={locale} />
    </section>
  </>;
}
