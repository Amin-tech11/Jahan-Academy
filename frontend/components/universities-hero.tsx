import Image from "next/image";
import styles from "./universities-hero.module.css";

export function UniversitiesHero() {
  return <section className={styles.hero} aria-labelledby="universities-wordmark">
    <Image src="/universities/hero/classical-campus.png" alt="" fill sizes="100vw" preload className={styles.image} />
    <div className={styles.overlay} aria-hidden="true" />
    <h1 className={styles.wordmark} id="universities-wordmark" dir="ltr">JAHAN ACADEMY</h1>
  </section>;
}
