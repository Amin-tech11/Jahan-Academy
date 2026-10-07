import Link from "next/link";
import type { Locale } from "@/lib/site-content";
import styles from "./panel-consultation-callout.module.css";

const copy = {
  services: ["خدمت مناسب، از شناخت شما شروع می‌شود", "از هدف‌ها و شرایطتان بگویید تا درباره قدم بعدی و خدمات متناسب با شما گفت‌وگو کنیم.", "The right support starts with understanding you", "Tell us about your goals and circumstances so we can discuss the support and next steps that fit you."],
  universities: ["انتخاب دانشگاه را با شناخت خودتان آغاز کنید", "رشته، مقطع و اولویت‌هایتان را با ما در میان بگذارید تا بررسی گزینه‌ها روشن‌تر شود.", "Start your university search with your goals", "Share your subject, degree level and priorities so we can help you explore your options."],
  destinations: ["مقصدی متناسب با مسیر شما", "هنوز میان کشورها مردد هستید؟ درباره هدف، زبان و ترجیح‌هایتان با ما گفت‌وگو کنید.", "Find a destination that fits your path", "Still comparing countries? Talk to us about your goals, language background and preferences."],
  about: ["آینده شما، ارزش یک گفت‌وگو را دارد", "از داستان و دغدغه‌هایتان بگویید؛ مسیر را با شناخت شما و یک گفت‌وگوی روشن آغاز می‌کنیم.", "Your future deserves a conversation", "Tell us your story and concerns. We start by understanding you and making your next step clearer."],
  destination: ["مسیر تحصیل در این کشور را برای خودتان روشن کنید", "شرایط تحصیلی، زبان و زمان‌بندی خود را مطرح کنید تا درباره گام بعدی گفت‌وگو کنیم.", "Clarify your study path in this country", "Discuss your academic background, language and timeline with us to explore your next step."],
  university: ["این دانشگاه با هدف شما هم‌مسیر است؟", "رشته موردنظر و سوابق خود را مطرح کنید تا پرسش‌های شما درباره انتخاب دانشگاه روشن‌تر شوند.", "Does this university fit your goals?", "Share your preferred subject and background so we can discuss your university selection questions."],
} as const;

export function PanelConsultationCallout({ locale, panel, subject }: { locale: Locale; panel: keyof typeof copy; subject?: string }) {
  const fa = locale === "fa";
  const content = copy[panel];
  const title = subject && panel === "destination"
    ? (fa ? `مسیر تحصیل در ${subject} را برای خودتان روشن کنید` : `Clarify your study path in ${subject}`)
    : subject && panel === "university"
      ? (fa ? `${subject} با هدف شما هم‌مسیر است؟` : `Does ${subject} fit your goals?`)
      : content[fa ? 0 : 2];
  return <section className={`${styles.card} panel-consultation-callout`} aria-label={fa ? "مشاوره درباره مسیر شما" : "Discuss your study path"}>
    <span className={styles.icon} aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a2 2 0 0 1-2 2H9l-4 4V4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2Z" /><path d="M9 6h8M9 9.5h5M2 8v12h12l4 2v-5" /></svg></span>
    <div className={styles.copy}><h2>{title}</h2><p>{content[fa ? 1 : 3]}</p></div>
    <Link className={styles.button} href={`/${locale}/free-consultation?source=${panel}-midpage`}>{fa ? "دریافت مشاوره رایگان" : "Get a free consultation"}<span aria-hidden="true">{fa ? "←" : "→"}</span></Link>
  </section>;
}
