import Image from "next/image";
import Link from "next/link";
import { SiteShell } from "@/components/site-shell";
import { brandContent } from "@/lib/brand-content";
import { aboutContent } from "@/lib/about-content";
import type { Locale } from "@/lib/site-content";
import styles from "./about-page.module.css";
import { HomeFaq } from "./home-faq";
import { HomeConsultation } from "./home-consultation";
import { AboutNavigation } from "./about-navigation";
import { AboutIcon, valueIcons, journeyIcons } from "./about-icon";

const copy = {
  fa: {
    label: "درباره جهان آکادمی",
    closingTitle: "داستان مسیر شما را با هم آغاز کنیم",
    closingText: "اکنون که با نگاه جهان آکادمی آشنا شدید، از هدف‌ها و دغدغه‌های خود برای ما بگویید. در یک مشاوره رایگان، شرایط شما را می‌شناسیم و درباره قدم بعدی مسیرتان گفت‌وگو می‌کنیم.",
    title: "جهانی از فرصت،", accent: "همراهی برای آیندهٔ شما.",
    subtitle: "ما کنار شما هستیم تا مسیر تحصیل در خارج از کشور را روشن‌تر ببینید و قدم بعدی را آگاهانه بردارید.",
    cta: "درخواست مشاوره رایگان", imageAlt: "نمایی الهام‌بخش از مسیر ورود به محوطهٔ دانشگاه",
    imageCaption: "آینده، از یک قدم آگاهانه آغاز می‌شود", storyTitle: "درباره ما",
    quote: "ما مهاجرت نمی‌فروشیم؛ آغاز می‌سازیم.",
    nav: ["درباره ما", "مأموریت و چشم‌انداز", "ارزش‌های ما", "مسیر همراهی", "سوالات متداول"],
    purposeTitle: "نگاه ما به فردای شما", valuesIntro: "اعتماد از انتخاب‌های کوچک و رفتارهای هر روز ساخته می‌شود. این اصول، مبنای گفت‌وگوی ما با شما هستند.",
    journeyTitle: "مسیر را با هم روشن می‌کنیم", journeyIntro: "نقطهٔ شروع، شناخت شماست؛ نه انتخاب یک کشور از روی نقشه.",
    steps: [
      { title: "شنیدن داستان شما", text: "دربارهٔ هدف، پیشینهٔ تحصیلی، سطح زبان و دغدغه‌هایتان گفت‌وگو می‌کنیم." },
      { title: "روشن‌کردن گزینه‌ها", text: "مقصدها و مسیرهای مرتبط را با توجه به بودجه، زمان و اولویت‌های شما بررسی می‌کنیم." },
      { title: "آمادگی برای قدم بعد", text: "نیازهای مسیر و گام‌های پیش رو را مشخص می‌کنیم تا بدانید از کجا شروع کنید." },
    ],
    faqTitle: "سوالات متداول", endTitle: "آیندهٔ شما، ارزش یک گفت‌وگو را دارد.", endText: "از هدف‌ها و پرسش‌هایتان بگویید. اولین قدم را با یک درخواست مشاوره رایگان بردارید.", skip: "رفتن به محتوای اصلی",
  },
  en: {
    label: "About Jahan Academy",
    closingTitle: "Let’s begin your next chapter together",
    closingText: "Now that you know our approach, tell us about your goals and concerns. In a free consultation, we will get to know your circumstances and discuss the next step in your journey.",
    title: "A world of opportunity.", accent: "A partner for your future.",
    subtitle: "We are here to help you understand your study-abroad options and take an informed next step.",
    cta: "Request free consultation", imageAlt: "An inspiring view of a path leading into a university campus",
    imageCaption: "The future starts with an informed step", storyTitle: "About us",
    quote: "We do not sell migration; we create beginnings.",
    nav: ["About us", "Mission & vision", "Our values", "Your journey", "FAQs"],
    purposeTitle: "Our perspective on your future", valuesIntro: "Trust grows through everyday choices and actions. These principles guide every conversation we have with you.",
    journeyTitle: "Finding clarity, together", journeyIntro: "Our starting point is understanding you, before choosing a country on a map.",
    steps: [
      { title: "Listen to your story", text: "We discuss your goals, academic background, language level, and concerns." },
      { title: "Explore your options", text: "We review relevant destinations and pathways in light of your budget, timing, and priorities." },
      { title: "Prepare your next step", text: "We clarify what the journey involves and the steps ahead so you know where to begin." },
    ],
    faqTitle: "Frequently Asked Questions", endTitle: "Your future deserves a conversation.", endText: "Tell us about your goals and questions. Take the first step with a free consultation request.", skip: "Skip to main content",
  },
};

export function AboutPage({ locale }: { locale: Locale }) {
  const c = copy[locale];
  const brand = brandContent[locale];
  const consultation = `/${locale}/consultation?source=about`;
  const number = (n: number) => new Intl.NumberFormat(locale, { minimumIntegerDigits: 2 }).format(n);
  return <div className={styles.theme}><SiteShell locale={locale}>
    <a className={styles.skip} href="#about-main">{c.skip}</a>
    <main className={styles.page} id="about-main">
      <section className={styles.banner} aria-label={c.label}>
        <Image src="/home-hero-documentary.png" alt={c.imageAlt} fill sizes="100vw" preload />
        <div className={styles.bannerOverlay} />
        <p className={styles.wordmark} aria-hidden="true">JAHAN ACADEMY</p>
      </section>
      <div className={styles.container}>
        <section className={styles.hero} aria-labelledby="about-title">
          <div className={styles.heroCopy}>
            <h1 id="about-title">{c.label}</h1>
            <p>{c.subtitle}</p>
          </div>
        </section>
      </div>
      <div className={`${styles.container} ${styles.guide}`}>
        <AboutNavigation labels={c.nav} title={locale === "fa" ? "با جهان آکادمی آشنا شوید" : "Get to know Jahan Academy"} />
        <section id="story" className={styles.story} aria-labelledby="story-title">
          <div><h2 id="story-title">{c.storyTitle}</h2><p className={styles.quote}>{c.quote}</p></div>
          <div className={styles.prose}>{aboutContent[locale].paragraphs.map((paragraph, i) => <p key={i}>{paragraph.split(/(\*\*.*?\*\*)/g).map((part, j) => part.startsWith("**") ? <strong key={j}>{part.slice(2, -2)}</strong> : part)}</p>)}</div>
        </section>
        <section id="purpose" className={styles.purpose} aria-labelledby="purpose-title">
          <div className={styles.sectionHeader}><h2 id="purpose-title">{c.purposeTitle}</h2></div>
          <div className={styles.purposeGrid}>{[{ title: brand.missionTitle, text: brand.missionText }, { title: brand.visionTitle, text: brand.visionText }].map((item, i) => <article key={item.title} className={i === 1 ? styles.visionCard : styles.missionCard}>
            <div className={styles.purposeCardHeader}><span className={styles.purposeIcon} aria-hidden="true"><svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{i === 0 ? <><circle cx="16" cy="16" r="11" /><circle cx="16" cy="16" r="6" /><path d="m16 16 10-10m-5 0h5v5" /></> : <><path d="M3 23h26M8 23a8 8 0 0 1 16 0M16 4v5M5 11l3 3m19-3-3 3M3 28h26" /><path d="m12 18 4-4 4 4m-4-4v8" /></>}</svg></span><span className={styles.purposeNumber} aria-hidden="true">{number(i + 1)}</span></div>
            <h3>{item.title}</h3><p>{item.text}</p>
          </article>)}</div>
        </section>
        <section className={styles.cta} aria-labelledby="consultation-title"><span className={styles.ctaMark} aria-hidden="true"><AboutIcon name="conversation" /></span><div><h2 id="consultation-title">{c.endTitle}</h2><p>{c.endText}</p></div><div className={styles.ctaAction}><Link className={styles.primary} href={consultation}>{c.cta}<span aria-hidden="true">{locale === "fa" ? "↖" : "↗"}</span></Link></div></section>
        <section id="values" className={styles.section} aria-labelledby="values-title"><div className={styles.sectionHeader}><div><h2 id="values-title">{brand.valuesTitle}</h2></div><p>{c.valuesIntro}</p></div>
          <div className={styles.valuesGrid}>{brand.values.map((value, i) => <article className={styles.valueCard} key={value.title}><div className={styles.valueTop}><span className={styles.icon}><AboutIcon name={valueIcons[i]} /></span><span className={styles.cardNumber}>{number(i + 1)}</span></div><h3>{value.title}</h3><p>{value.text}</p></article>)}</div>
        </section>
        <section id="journey" className={styles.section} aria-labelledby="journey-title"><div className={styles.sectionHeader}><h2 id="journey-title">{c.journeyTitle}</h2><p>{c.journeyIntro}</p></div><ol className={styles.steps}>{c.steps.map((step, i) => <li key={step.title}><span className={styles.stepNumber}>{new Intl.NumberFormat(locale).format(i + 1)}</span><span className={styles.stepIcon}><AboutIcon name={journeyIcons[i]} /></span><h3>{step.title}</h3><p>{step.text}</p></li>)}</ol></section>
        <section id="questions" className={styles.faq} aria-labelledby="faq-title"><div className="home-faq__grid"><div className="home-faq__intro"><h2 id="faq-title">{c.faqTitle}</h2></div><HomeFaq items={brand.faqs} /></div></section>

      </div>
      <section className={`home-closing ${styles.closing}`} id="about-consultation" aria-labelledby="about-closing-title">
        <div className={styles.container}>
          <header className="home-closing__heading"><h2 id="about-closing-title">{c.closingTitle}</h2><p>{c.closingText}</p></header>
          <div className="home-closing__layout">
            <div className="home-closing__image"><Image src="/journey/profile-assessment.png" alt={locale === "fa" ? "گفت‌وگو و مشاوره درباره مسیر تحصیلی" : "A consultation about your study pathway"} fill sizes="(max-width: 800px) 100vw, 50vw" /></div>
            <HomeConsultation locale={locale} sourcePageUrl={`/${locale}/about#about-consultation`} />
          </div>
        </div>
      </section>
    </main>
  </SiteShell></div>;
}
