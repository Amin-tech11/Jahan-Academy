import type { Locale } from "@/lib/site-content";
import { DestinationComparison } from "./destination-decision-tools";
import styles from "./destinations-overview.module.css";

function DestinationCriterionIcon({ index }: { index: number }) {
  const paths = [
    "M3 3h12v10H8l-4 3v-3H3V3Zm12 5h6v10h-3v3l-4-3H9v-3M6 6h6M6 9h4",
    "M3 21h18M4 21V8h7v13m0-16h9v16M6 11h3m-3 3h3m-3 3h3m5-9h3m-3 3h3m-3 3h3m-3 3h3",
    "M14 11a4 4 0 1 0-7 2M10 2v2m-6 0 1 2m-4 4h2m13-6-1 2m4 4h-2M7 20H5a3 3 0 0 1 0-6h2a5 5 0 0 1 9-1h1a3.5 3.5 0 0 1 0 7H7Z",
    "M3 10l9-7 9 7M5 9v12h14V9M12 17l-3-3a2 2 0 0 1 3-3 2 2 0 0 1 3 3l-3 3Z",
  ];
  return <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[index]} /></svg>;
}

export function DestinationDecisionGuide({ locale }: { locale: Locale }) {
  const t = (fa: string, en: string) => locale === "fa" ? fa : en;
  const criteria = [
    [t("زبان زندگی روزمره", "Everyday language"), t("با زبان‌های رایج مقصد آشنا شوید و راحتی خود در ارتباط روزمره را در نظر بگیرید.", "Get to know the destination’s common languages and consider your comfort with everyday communication.")],
    [t("شهر و سبک زندگی", "City and lifestyle"), t("فضای شهری، حمل‌ونقل، دسترسی به خدمات و سبک زندگی موردعلاقه‌تان را بررسی کنید.", "Consider the urban setting, transport, access to services and your preferred lifestyle.")],
    [t("آب‌وهوا و محیط", "Climate and surroundings"), t("تفاوت فصل‌ها و محیط زندگی را کنار عادت‌ها و ترجیح‌های شخصی خود قرار دهید.", "Consider seasonal differences and surroundings alongside your habits and preferences.")],
    [t("فاصله و ارتباط با خانواده", "Distance and family connections"), t("فاصله جغرافیایی، اختلاف ساعت و اهمیت ارتباط با خانواده را در شناخت مقصد لحاظ کنید.", "Consider geographical distance, time differences and the importance of staying connected with family.")],
  ];
  return <>
    <section id="destination-criteria" className={styles.section} aria-labelledby="destination-criteria-title">
      <div className={styles.decisionHeading}><h2 id="destination-criteria-title">{t("معیارهای شناخت مقصد", "Getting to know a destination")}</h2></div>
      <div className={styles.decisionCriteria}>{criteria.map(([title, text], index) => <article className={`${styles.card} ${styles.typeCard}`} key={title}><span className={styles.typeIcon}><DestinationCriterionIcon index={index} /></span><h3>{title}</h3><p>{text}</p></article>)}</div>
    </section>
    <section id="destination-comparison" className={styles.section} aria-labelledby="destination-comparison-title">
      <div className={styles.decisionHeading}><h2 id="destination-comparison-title">{t("نگاهی کنار هم به کشورها", "Countries at a glance")}</h2></div>
      <DestinationComparison locale={locale} />
    </section>
  </>;
}
