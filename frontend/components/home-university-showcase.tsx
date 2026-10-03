"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { animateHomeElement } from "@/lib/home-motion";

import { homeUniversities, type HomeUniversity } from "@/lib/home-universities";
import { headerDestinations, type Locale } from "@/lib/site-content";

function UniversityCard({ university, locale }: { university: HomeUniversity; locale: Locale }) {
  return <article className="home-university-card">
    <div className="home-university-card__media">
      <Image src={university.image} alt={locale === "fa" ? `نمایی از ${university.name}` : `View of ${university.name}`} fill sizes="(max-width: 600px) 100vw, (max-width: 800px) 50vw, 33vw" />
    </div>
    <div className="home-university-card__body" dir={locale === "fa" ? "rtl" : "ltr"}>
      <span className={`home-university-card__mark${university.slug === "chalmers-university-of-technology" ? " home-university-card__mark--dark" : ""}`} aria-hidden="true"><Image src={university.logo} alt="" width={44} height={44} /></span>
      <h3 dir="ltr">{university.name}</h3>
      <p className="home-university-card__location" dir="ltr">{university.location}</p>
      <p className="home-university-card__summary">{university.summary[locale]}</p>
    </div>
  </article>;
}

export function HomeUniversityShowcase({ locale }: { locale: Locale }) {
  const [activeCountry, setActiveCountry] = useState("canada");
  const gridRef = useRef<HTMLDivElement>(null);
  const previousCountry = useRef(activeCountry);
  useEffect(() => {
    if (previousCountry.current === activeCountry) return;
    previousCountry.current = activeCountry;
    if (gridRef.current) return animateHomeElement(gridRef.current);
  }, [activeCountry]);
  const countries = [...headerDestinations].sort((a, b) => a[locale].localeCompare(b[locale], locale));
  const visibleUniversities = homeUniversities.filter((university) => university.country === activeCountry);

  return <>
    <div className="home-universities__filters" role="group" aria-label={locale === "fa" ? "انتخاب کشور دانشگاه‌ها" : "Choose a university country"} dir={locale === "fa" ? "rtl" : "ltr"}>
      {countries.map((country) => <button key={country.slug} type="button" className="home-universities__country" aria-pressed={activeCountry === country.slug} onClick={() => setActiveCountry(country.slug)}>
        <Image src={`/home-country-maps/${country.slug}.svg`} alt="" width={64} height={64} />
        <span>{country[locale]}</span>
      </button>)}
    </div>
    <div className="home-universities" ref={gridRef} dir={locale === "fa" ? "rtl" : "ltr"} aria-live="polite">
      {visibleUniversities.map((university) => <UniversityCard key={university.slug} university={university} locale={locale} />)}
    </div>
  </>;
}
