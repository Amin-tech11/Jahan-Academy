import type { Locale } from "@/lib/site-content";
import { DestinationComparison, DestinationReadiness } from "./destination-decision-tools";
import styles from "./destinations-overview.module.css";

export function DestinationDecisionGuide({ locale }: { locale: Locale }) {
  const t = (fa: string, en: string) => locale === "fa" ? fa : en;
  const steps = [
    [t("تصویر روشنی از شرایط خود بسازید", "Start with your own situation"), t("رشته و مقطع، سوابق تحصیلی، سطح زبان و بودجه قابل تأمین خود را بنویسید.", "Write down your subject, qualification, academic background, language level and available budget."), t("خروجی: خلاصه شرایط و اولویت‌ها", "Outcome: a profile and priorities")],
    [t("کشورها را به گزینه‌های مشخص تبدیل کنید", "Turn countries into concrete options"), t("در دو یا سه کشور، شهر و دوره‌ای متناسب با هدفتان پیدا کنید. نام کشور به‌تنهایی برای تصمیم کافی نیست.", "Identify a city and suitable course in two or three countries. A country name alone is not enough."), t("خروجی: فهرست کوتاه کشور، شهر و دوره", "Outcome: a country, city and course shortlist")],
    [t("امکان اقدام را بررسی کنید", "Check whether you can apply"), t("شرایط ورود، زبان، هزینه و مهلت همان دوره را کنار سوابق خود قرار دهید و موارد نامشخص را یادداشت کنید.", "Compare the course’s entry, language, cost and deadline requirements against your background; record uncertainties."), t("خروجی: الزامات و پرسش‌های باز", "Outcome: requirements and open questions")],
    [t("برای قدم بعد برنامه داشته باشید", "Plan the next step"), t("زمان آماده‌سازی مدارک و زبان را مشخص کنید و برای بررسی گزینه‌ها، اطلاعات و پرسش‌های خود را به جلسه مشاوره بیاورید.", "Plan time for documents and language preparation; bring your findings and questions to a consultation."), t("خروجی: برنامه آماده‌سازی و زمان‌بندی", "Outcome: preparation and timing")],
  ];
  const criteria = [
    [t("تناسب رشته و دوره", "Course fit"), t("محتوای دوره، پیش‌نیازها و شیوه آموزش با هدف و مدرک قبلی شما هماهنگ است؟", "Do curriculum, prerequisites and teaching methods fit your goals and prior qualification?"), t("بررسی کنید: صفحه رسمی دوره", "Check: the official course page")],
    [t("زبان تحصیل و زندگی", "Study and everyday language"), t("زبان کلاس، مدرک موردنیاز و زبان زندگی روزمره را جداگانه بسنجید.", "Review classroom language, required evidence and everyday language separately."), t("بررسی کنید: زبان دوره و شرایط آزمون", "Check: course language and test requirements")],
    [t("بودجه قابل تأمین", "Affordable budget"), t("شهریه و هزینه زندگی شهر را برای یک بازه یکسان کنار هزینه‌های اولیه قرار دهید.", "Combine tuition, city living costs and initial expenses over the same period."), t("بررسی کنید: شهریه و گزینه‌های مسکن", "Check: tuition and housing options")],
    [t("شهر و سبک زندگی", "City and lifestyle"), t("مسکن، رفت‌وآمد، آب‌وهوا، فاصله از خانواده و امکانات موردنیاز خود را بررسی کنید.", "Review housing, transport, climate, distance from family and the facilities you need."), t("بررسی کنید: خدمات دانشجویی و راهنمای شهر", "Check: student services and city guidance")],
    [t("زمان و آمادگی اقدام", "Timing and readiness"), t("آیا فرصت آماده‌سازی زبان و مدارک پیش از مهلت درخواست را دارید؟", "Do you have time to prepare language evidence and documents before the deadline?"), t("بررسی کنید: تقویم پذیرش و فهرست مدارک", "Check: application calendar and documents")],
    [t("هدف پس از تحصیل", "Goals after study"), t("ارتباط دوره با مسیر حرفه‌ای، خدمات شغلی دانشگاه و تجربه عملی آن را بررسی کنید.", "Consider the course’s career relevance, university career services and practical experience."), t("بررسی کنید: محتوای دوره و خدمات شغلی", "Check: curriculum and career services")],
  ];
  const budget = [
    [t("هزینه آموزشی", "Education"), t("شهریه، ثبت‌نام، مواد آموزشی و هزینه‌های اعلام‌شده دوره.", "Tuition, enrolment, materials and stated course expenses.")],
    [t("زندگی در شهر", "Living in the city"), t("اجاره و ودیعه، قبوض، خوراک، حمل‌ونقل و بیمه موردنیاز.", "Rent and deposit, bills, food, transport and required insurance.")],
    [t("شروع مسیر", "Getting started"), t("آماده‌سازی و ترجمه مدارک، آزمون زبان، سفر و هزینه‌های اولیه استقرار.", "Document preparation and translation, language tests, travel and settling in.")],
  ];
  return <>
    <section id="destination-planning" className={styles.section} aria-labelledby="destination-planning-title">
      <div className={styles.decisionHeading}><span>{t("از شناخت تا اقدام", "From research to action")}</span><h2 id="destination-planning-title">{t("برنامه‌ریزی تحصیلی", "Study planning")}</h2><p>{t("به‌جای انتخاب سریع یک کشور، مسیر بررسی را به چهار قدم روشن تقسیم کنید.", "Break your research into four clear steps before committing to a country.")}</p></div>
      <ol className={styles.planningSteps}>{steps.map(([title, text, outcome], index) => <li key={title}><span className={styles.stepNumber}>{new Intl.NumberFormat(locale, { minimumIntegerDigits: 2 }).format(index + 1)}</span><div><h3>{title}</h3><p>{text}</p><strong className={styles.stepOutcome}>{outcome}</strong></div></li>)}</ol>
    </section>
    <section id="destination-criteria" className={styles.section} aria-labelledby="destination-criteria-title">
      <div className={styles.decisionHeading}><span>{t("انتخاب بر اساس شرایط شما", "Choose around your circumstances")}</span><h2 id="destination-criteria-title">{t("معیارهای انتخاب مقصد", "Destination selection criteria")}</h2><p>{t("معیارهای ضروری را از ترجیح‌های شخصی جدا کنید؛ مثلاً زبان قابل‌دستیابی و بودجه با سلیقه شما درباره شهر یکسان نیستند.", "Separate essential requirements from personal preferences: achievable language requirements and budget serve a different role from city preferences.")}</p></div>
      <div className={styles.decisionCriteria}>{criteria.map(([title, text, check], index) => <article key={title}><span className={styles.criterionNumber}>{new Intl.NumberFormat(locale, { minimumIntegerDigits: 2 }).format(index + 1)}</span><h3>{title}</h3><p>{text}</p><strong>{check}</strong></article>)}</div>
    </section>
    <section id="destination-comparison" className={styles.section} aria-labelledby="destination-comparison-title">
      <div className={styles.decisionHeading}><span>{t("دو گزینه، کنار هم", "Two options, side by side")}</span><h2 id="destination-comparison-title">{t("مقایسه مقصدها", "Compare destinations")}</h2><p>{t("دو کشور را انتخاب کنید، راهنمای آن‌ها را بخوانید و یافته‌های مربوط به دوره و شهر خود را یادداشت کنید.", "Choose two countries, read their guides and record findings for your own course and city.")}</p></div>
      <DestinationComparison locale={locale} />
    </section>
    <section id="destination-budget" className={styles.section} aria-labelledby="destination-budget-title">
      <div className={styles.decisionHeading}><span>{t("تصویر کامل هزینه‌ها", "The full cost picture")}</span><h2 id="destination-budget-title">{t("بودجه مقصد را چگونه بررسی کنیم؟", "How to research your destination budget")}</h2><p>{t("بودجه را فقط با شهریه نسنجید. این سه گروه را برای هر گزینه جداگانه یادداشت کنید.", "Look beyond tuition. Record these three categories separately for each option.")}</p></div>
      <div className={styles.budgetCards}>{budget.map(([title, text]) => <article key={title}><h3>{title}</h3><p>{text}</p></article>)}</div>
      <div className={styles.decisionNote}><strong>{t("برای مقایسه دقیق‌تر", "For a clearer comparison")}</strong><p>{t("واحد پول، بازه زمانی، شهر و نوع مسکن را مشخص کنید. بورسیه تأییدنشده یا درآمد احتمالی را به‌جای بودجه قطعی حساب نکنید؛ شرایط حمایت مالی را در منبع ارائه‌دهنده بخوانید.", "Specify currency, time period, city and housing type. Keep unconfirmed scholarships or possible income separate from your available budget; read funding terms with the provider.")}</p></div>
    </section>
    <section id="destination-readiness" className={styles.section} aria-labelledby="destination-readiness-title">
      <div className={styles.decisionHeading}><span>{t("پیش از تصمیم نهایی", "Before your final decision")}</span><h2 id="destination-readiness-title">{t("چک‌لیست آمادگی انتخاب مقصد", "Destination selection checklist")}</h2><p>{t("موارد بررسی‌شده را علامت بزنید و از باقی‌مانده‌ها برای آماده‌کردن پرسش‌های مشاوره استفاده کنید.", "Mark what you have reviewed and use the remaining items to prepare consultation questions.")}</p></div>
      <DestinationReadiness locale={locale} />
    </section>
  </>;
}
