"use client";

import Image from "next/image";
import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import type { Locale } from "@/lib/site-content";
import type { UniversityPhoto } from "@/lib/university-info-model";
import styles from "./university-info.module.css";

export function UniversityGallery({ photos, name, locale }: { photos: UniversityPhoto[]; name: string; locale: Locale }) {
  const [selected, setSelected] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const fa = locale === "fa";
  if (!photos.length) return <div className={styles.noPhoto}><span aria-hidden="true">◇</span><p>{name}</p><small>{fa ? "تصویر دانشگاه هنوز منتشر نشده است" : "Campus photography is not yet available"}</small></div>;
  const open = (index: number) => { setSelected(index); dialog.current?.showModal(); };
  const move = (delta: number) => setSelected((current) => (current + delta + photos.length) % photos.length);
  return <>
    <div className={`${styles.gallery} ${photos.length === 1 ? styles.singlePhoto : ""}`}>
      {photos.slice(0, 4).map((photo, index) => <button className={styles.photo} key={photo.src} type="button" onClick={() => open(index)} aria-label={`${fa ? "نمایش تصویر:" : "View photo:"} ${photo.caption[locale]}`}>
        <Image src={photo.src} alt={photo.caption[locale]} fill sizes={photos.length === 1 ? "(max-width: 900px) 100vw, 1160px" : index === 0 ? "(max-width: 700px) 100vw, 60vw" : "(max-width: 700px) 33vw, 25vw"} preload={index === 0} />
        {index === 0 && <span className={styles.photoCaption}>{fa ? "نگاهی به پردیس" : "A closer look at campus"}<span>{fa ? `مشاهده ${photos.length.toLocaleString("fa")} تصویر ↗` : `View ${photos.length} photos ↗`}</span></span>}
      </button>)}
    </div>
    <dialog className={styles.lightbox} ref={dialog} aria-label={fa ? `تصاویر ${name}` : `${name} photos`} onClick={(event) => { if (event.target === dialog.current) dialog.current.close(); }} onKeyDown={(event) => { if (event.key === "ArrowRight") move(1); if (event.key === "ArrowLeft") move(-1); }}>
      <div className={styles.lightboxTop}><p aria-live="polite">{photos[selected].caption[locale]} · {(selected + 1).toLocaleString(locale)} / {photos.length.toLocaleString(locale)}</p><button autoFocus type="button" onClick={() => dialog.current?.close()} aria-label={fa ? "بستن تصاویر" : "Close photos"}>×</button></div>
      <div className={styles.lightboxImage}><Image src={photos[selected].src} alt={photos[selected].caption[locale]} fill sizes="90vw" /></div>
      {photos.length > 1 && <div className={styles.lightboxControls}><button type="button" onClick={() => move(-1)}>{fa ? "تصویر قبلی" : "Previous photo"}</button><button type="button" onClick={() => move(1)}>{fa ? "تصویر بعدی" : "Next photo"}</button></div>}
    </dialog>
  </>;
}

export function UniversityTabs({ locale, overview, features, location }: { locale: Locale; overview: ReactNode; features: ReactNode; location: ReactNode }) {
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const labels = locale === "fa" ? ["معرفی دانشگاه", "ویژگی‌های دانشگاه", "موقعیت مکانی"] : ["Overview", "Campus features", "Location"];
  const names = ["overview", "features", "location"];
  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const direction = locale === "fa" ? -1 : 1;
    const next = event.key === "Home" ? 0 : event.key === "End" ? 2 : event.key === "ArrowRight" ? (active + direction + 3) % 3 : event.key === "ArrowLeft" ? (active - direction + 3) % 3 : undefined;
    if (next !== undefined) { event.preventDefault(); setActive(next); tabs.current[next]?.focus(); }
  }
  return <section className={styles.details} aria-label={locale === "fa" ? "اطلاعات دانشگاه" : "University information"}>
    <div role="tablist" className={styles.tabs} aria-label={locale === "fa" ? "بخش‌های اطلاعات دانشگاه" : "University detail sections"}>
      {labels.map((label, index) => <button type="button" key={names[index]} ref={(element) => { tabs.current[index] = element; }} id={`tab-${names[index]}`} role="tab" aria-selected={active === index} aria-controls={`panel-${names[index]}`} tabIndex={active === index ? 0 : -1} onClick={() => setActive(index)} onKeyDown={onKeyDown}>{label}</button>)}
    </div>
    {[overview, features, location].map((content, index) => <div key={names[index]} id={`panel-${names[index]}`} role="tabpanel" aria-labelledby={`tab-${names[index]}`} hidden={active !== index} tabIndex={0} className={styles.tabContent}>{content}</div>)}
  </section>;
}
