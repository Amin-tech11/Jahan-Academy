import Link from "next/link";
import type { Locale } from "@/lib/site-content";
import styles from "./floating-consultation.module.css";

export function FloatingConsultation({ locale }: { locale: Locale }) {
  const fa = locale === "fa";
  return <aside className={styles.card} aria-label={fa ? "مشاوره اولیه رایگان" : "Free initial consultation"}>
    <div className={styles.heading}>
      <span className={styles.icon} aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 4h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-8l-6 4v-4H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" /><path d="M7 9h10M7 13h6" /></svg></span>
      <span><strong>{fa ? "مشاوره اولیه رایگان" : "Free initial consultation"}</strong><small>{fa ? "قدم بعدی را با هم روشن کنیم" : "Let’s clarify your next step"}</small></span>
    </div>
    <Link className={styles.button} href={`/${locale}/free-consultation?source=floating-consultation`}>
      {fa ? "درخواست مشاوره" : "Request consultation"}
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={fa ? "M19 12H5m6-6-6 6 6 6" : "M5 12h14m-6-6 6 6-6 6"} /></svg>
    </Link>
  </aside>;
}
