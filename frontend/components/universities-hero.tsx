import { PreparedImage as Image } from "@/components/prepared-image";
import styles from "./universities-hero.module.css";

export function UniversitiesHero({ locale = "fa" }: { locale?: "fa" | "en" }) {
  return <section className={styles.hero} aria-labelledby="universities-wordmark">
    <Image src="/universities/hero/classical-campus.png" alt="" fill sizes="100vw" preload className={styles.image} />
    <div className={styles.overlay} aria-hidden="true" />
    <h1 className="sr-only">{locale === "fa" ? "دانشگاه‌های جهان آکادمی" : "Explore universities with Jahan Academy"}</h1>
    <div className={`${styles.wordmark} public-hero-brand`} lang="en" id="universities-wordmark" dir="ltr">JAHAN ACADEMY</div>
  </section>;
}
