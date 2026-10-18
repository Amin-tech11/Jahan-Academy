import type { Locale } from "@/lib/site-content";
import { universityAdmissions, type AdmissionRow } from "@/lib/university-admissions";
import styles from "./university-admissions.module.css";

const labels: Record<AdmissionRow["kind"], Record<Locale, string>> = {
  entry: { fa: "شرایط تحصیلی", en: "Academic entry requirements" },
  language: { fa: "مدرک زبان", en: "English proficiency" },
  documents: { fa: "مدارک پرونده", en: "Application documents" },
  deadline: { fa: "ورودی و مهلت‌ها", en: "Intake and deadlines" },
  cost: { fa: "هزینه درخواست و شهریه", en: "Application fee and tuition" },
};

export function UniversityAdmissionsSection({ slug, locale }: { slug: string; locale: Locale }) {
  const admissions = universityAdmissions[slug];
  if (!admissions) return null;
  const fa = locale === "fa";
  return <section className={styles.section} aria-labelledby="university-admissions-title">
    <h2 id="university-admissions-title">{fa ? "پذیرش رشته‌ها و مقاطع منتخب" : "Admissions for selected degrees"}</h2>
    <p>{fa ? "شرایط زیر برای مسیرهای مشخصِ متقاضی بین‌المللی است؛ حداقل‌ها تضمین پذیرش نیستند. سال ورودی، ظرفیت و چک‌لیست شخصی را پیش از اقدام در سامانه دانشگاه تأیید کنید." : "These summaries cover specific international application routes. Minimum requirements do not guarantee admission; confirm the intake year, availability and your individual checklist with the university."}</p>
    <p className={styles.review}>{fa ? "بررسی منابع رسمی: " : "Official sources checked: "}<time dateTime={admissions.reviewedAt}>{new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en-GB", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${admissions.reviewedAt}T12:00:00Z`))}</time></p>
    <div className={styles.programmes}>{admissions.programmes.map(programme => <article className={styles.programme} key={programme.id} aria-labelledby={`admission-${programme.id}`}>
      <h3 id={`admission-${programme.id}`}>{programme.title[locale]}</h3>
      <p className={styles.scope}>{programme.scope[locale]}</p>
      <dl>{programme.rows.map(row => <div className={styles.row} key={row.kind}>
        <dt>{labels[row.kind][locale]}</dt>
        <dd><p>{row.text[locale]}</p></dd>
      </div>)}</dl>
    </article>)}</div>
  </section>;
}
