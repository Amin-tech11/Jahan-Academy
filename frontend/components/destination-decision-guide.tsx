import type { Locale } from "@/lib/site-content";
import { DestinationComparison } from "./destination-decision-tools";
import styles from "./destinations-overview.module.css";

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
      <div className={styles.decisionHeading}><h2 id="destination-criteria-title">{t("معیارهای شناخت مقصد", "Getting to know a destination")}</h2><p>{t("برای شناخت اولیه کشورها، از ویژگی‌های زندگی و ترجیح‌های شخصی خود شروع کنید. برای بررسی مسیر متناسب با شرایط شما، درخواست مشاوره رایگان ثبت کنید.", "Start exploring countries through everyday life and your personal preferences. Request a free consultation to discuss a path suited to your circumstances.")}</p></div>
      <div className={styles.decisionCriteria}>{criteria.map(([title, text]) => <article key={title}><h3>{title}</h3><p>{text}</p></article>)}</div>
    </section>
    <section id="destination-comparison" className={styles.section} aria-labelledby="destination-comparison-title">
      <div className={styles.decisionHeading}><h2 id="destination-comparison-title">{t("نگاهی کنار هم به کشورها", "Countries at a glance")}</h2><p>{t("نام کشور، پایتخت و زبان‌های رایج را کنار هم ببینید و برای آشنایی بیشتر، معرفی مقصد را بخوانید.", "View country names, capitals and common languages side by side, then read the destination introductions.")}</p></div>
      <DestinationComparison locale={locale} />
    </section>
  </>;
}
