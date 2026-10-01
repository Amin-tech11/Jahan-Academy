"use client";

import Image from "next/image";
import { useState } from "react";
import type { Locale } from "@/lib/site-content";
import styles from "./universities-hero.module.css";

const slides = [
  { file: "campus", fa: "محوطهٔ دانشگاه", en: "University campus" },
  { file: "library", fa: "کتابخانهٔ دانشگاه", en: "University library" },
  { file: "research", fa: "پژوهش دانشگاهی", en: "University research" },
  { file: "student-life", fa: "زندگی دانشجویی", en: "Student life" },
];

export function UniversitiesHero({ locale }: { locale: Locale }) {
  const [active, setActive] = useState(0);
  return <section className={styles.hero} aria-label={locale === "fa" ? "تصاویر فضای دانشگاه" : "University life images"} aria-roledescription={locale === "fa" ? "اسلایدر" : "carousel"}>
    <h1 className={styles.srOnly}>{locale === "fa" ? "دانشگاه‌ها" : "Universities"}</h1>
    {slides.map((slide, index) => <div className={`${styles.slide} ${index === active ? styles.active : ""}`} aria-hidden={index !== active} key={slide.file}>
      <Image src={`/universities/hero/${slide.file}.png`} alt={slide[locale]} fill sizes="100vw" preload={index === 0} loading={index === 0 ? undefined : "eager"} className={styles.image} />
    </div>)}
    <div className={styles.shade} aria-hidden="true" />
    <div className={styles.controls} role="group" aria-label={locale === "fa" ? "انتخاب تصویر" : "Choose image"}>
      {slides.map((slide, index) => <button type="button" key={slide.file} className={`${styles.dot} ${index === active ? styles.selected : ""}`} aria-label={slide[locale]} aria-pressed={index === active} onClick={() => setActive(index)}><span /></button>)}
    </div>
  </section>;
}
